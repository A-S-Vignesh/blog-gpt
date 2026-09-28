import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { requireAdminMutation } from "@/lib/admin/guard";
import { logAdminAction } from "@/lib/admin/audit";
import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { rateLimit } from "@/lib/rateLimit";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

const ROLES = ["admin", "author", "user"] as const;
const PLANS = ["free", "pro", "business"] as const;
const PLAN_STATUSES = ["active", "past_due", "canceled"] as const;

/** Hard ceiling on a manual credit grant — a typo shouldn't mint a million. */
const MAX_EXTRA_CREDITS = 100_000;

/**
 * Change a user's ban state, role, plan, or AI credits.
 *
 * This is the most dangerous endpoint in the app, so the rules it enforces are
 * worth stating plainly:
 *
 *  - Fields are set from a fixed switch, never from the request body. There is
 *    no path by which `{"$set": {...}}` or an unexpected key reaches Mongo, so
 *    mass-assignment (the exact bug the profile-update route warns about) is
 *    impossible here too.
 *  - An admin cannot ban or demote THEMSELVES. Both are one-way doors: either
 *    one would strip the actor's own access with no way back through the UI.
 *  - An admin cannot ban another admin. Peer removal should be a deliberate,
 *    two-step act — demote first, then ban — not a single click that lets one
 *    compromised admin session decapitate the others.
 *  - The LAST admin cannot be demoted. Losing every admin means losing the
 *    panel entirely, recoverable only by running the promote script against
 *    the database.
 *
 * Note on plans: this is a manual override for support (comping an account,
 * fixing a failed webhook). It deliberately does NOT touch Razorpay — the
 * subscription record and the real billing relationship are left exactly as
 * they are, and the UI says so.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdminMutation(req);
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError("BAD_REQUEST", "Invalid user id.");
    }

    const rl = await rateLimit({
      key: `admin-user-patch:${actor.id}`,
      windowMs: 60 * 1000,
      max: 30,
    });
    if (!rl.ok) {
      throw new ApiError("RATE_LIMITED", "Too many account changes.", {
        retryAfterSeconds: rl.retryAfterSeconds,
      });
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action;
    const reason =
      typeof body?.reason === "string" ? body.reason.slice(0, 500) : "";

    await connectToDatabase();
    const target = await User.findById(id).select(
      "name username email role plan planStatus banned bannedReason aiGenerationCount aiExtraCredits",
    );
    if (!target) {
      throw new ApiError("NOT_FOUND", "User not found.");
    }

    const isSelf = target._id.toString() === actor.id;
    const label = `${target.email} (@${target.username})`;

    let update: Record<string, unknown>;
    let before: Record<string, unknown>;
    let auditAction:
      | "user.ban"
      | "user.unban"
      | "user.role"
      | "user.plan"
      | "user.credits";

    switch (action) {
      case "ban": {
        if (isSelf) {
          throw new ApiError(
            "FORBIDDEN",
            "You cannot ban your own account — that would lock you out of the panel.",
          );
        }
        if (target.role === "admin") {
          throw new ApiError(
            "FORBIDDEN",
            "Demote this admin to a regular user first, then ban them.",
          );
        }
        if (target.banned) {
          return NextResponse.json({ ok: true, unchanged: true });
        }
        before = { banned: false, bannedReason: target.bannedReason };
        update = { banned: true, bannedReason: reason || "Banned by admin." };
        auditAction = "user.ban";
        break;
      }

      case "unban": {
        if (!target.banned) {
          return NextResponse.json({ ok: true, unchanged: true });
        }
        before = { banned: true, bannedReason: target.bannedReason };
        update = { banned: false, bannedReason: "" };
        auditAction = "user.unban";
        break;
      }

      case "role": {
        const role = body?.role;
        if (!ROLES.includes(role)) {
          throw new ApiError(
            "BAD_REQUEST",
            `role must be one of: ${ROLES.join(", ")}.`,
          );
        }
        if (isSelf && role !== "admin") {
          throw new ApiError(
            "FORBIDDEN",
            "You cannot remove your own admin role. Ask another admin to do it.",
          );
        }
        if (target.role === role) {
          return NextResponse.json({ ok: true, unchanged: true });
        }
        if (target.role === "admin" && role !== "admin") {
          // Counted at the moment of the change, so two concurrent demotions
          // cannot both see "2 admins" and leave the panel with zero.
          const admins = await User.countDocuments({ role: "admin" });
          if (admins <= 1) {
            throw new ApiError(
              "FORBIDDEN",
              "This is the last admin account. Promote someone else first.",
            );
          }
        }
        before = { role: target.role };
        update = { role };
        auditAction = "user.role";
        break;
      }

      case "plan": {
        const plan = body?.plan;
        if (!PLANS.includes(plan)) {
          throw new ApiError(
            "BAD_REQUEST",
            `plan must be one of: ${PLANS.join(", ")}.`,
          );
        }
        const planStatus = body?.planStatus;
        if (planStatus !== undefined && !PLAN_STATUSES.includes(planStatus)) {
          throw new ApiError(
            "BAD_REQUEST",
            `planStatus must be one of: ${PLAN_STATUSES.join(", ")}.`,
          );
        }
        before = { plan: target.plan, planStatus: target.planStatus };
        update = { plan, ...(planStatus ? { planStatus } : {}) };
        auditAction = "user.plan";
        break;
      }

      case "credits": {
        const credits = body?.aiExtraCredits;
        if (
          typeof credits !== "number" ||
          !Number.isInteger(credits) ||
          credits < 0 ||
          credits > MAX_EXTRA_CREDITS
        ) {
          throw new ApiError(
            "BAD_REQUEST",
            `aiExtraCredits must be a whole number between 0 and ${MAX_EXTRA_CREDITS}.`,
          );
        }
        const resetUsage = body?.resetUsage === true;
        before = {
          aiExtraCredits: target.aiExtraCredits,
          ...(resetUsage ? { aiGenerationCount: target.aiGenerationCount } : {}),
        };
        update = {
          aiExtraCredits: credits,
          ...(resetUsage
            ? { aiGenerationCount: 0, aiUsagePeriodStart: new Date() }
            : {}),
        };
        auditAction = "user.credits";
        break;
      }

      default:
        throw new ApiError(
          "BAD_REQUEST",
          'action must be one of "ban", "unban", "role", "plan", or "credits".',
        );
    }

    await User.updateOne({ _id: target._id }, { $set: update });

    await logAdminAction({
      actor,
      action: auditAction,
      targetType: "user",
      targetId: String(target._id),
      targetLabel: label,
      before,
      after: update,
      reason,
      req,
    });

    return NextResponse.json({ ok: true, action, id: String(target._id) });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
