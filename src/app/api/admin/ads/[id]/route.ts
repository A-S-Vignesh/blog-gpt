import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { requireAdminMutation } from "@/lib/admin/guard";
import { logAdminAction } from "@/lib/admin/audit";
import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { rateLimit } from "@/lib/rateLimit";
import { connectToDatabase } from "@/lib/mongodb";
import AdCampaign from "@/models/AdCampaign";
import { User } from "@/models/User";
import { sendEmail } from "@/lib/email/send";
import { adDecisionEmail } from "@/lib/email/templates";
import {
  getSlotAvailability,
  startClockOnPayment,
  syncCampaignSchedules,
} from "@/lib/ads/serve";
import { AD_PLACEMENTS, formatCents, type AdPlacement } from "@/config/ads";

export const dynamic = "force-dynamic";

/**
 * Review decisions on an ad campaign.
 *
 * Body: { action: "approve" | "reject" | "pause" | "resume" | "mark_paid"
 *         | "refund", reason?: string }
 *
 * `mark_paid` exists for the offline path — an advertiser who pays by invoice
 * or bank transfer rather than through Razorpay Checkout. It is the one place
 * money state can be set without a payment signature, which is exactly why it
 * is admin-only, audited with the amount, and reflected in the advertiser's
 * dashboard as paid.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdminMutation(req);
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError("BAD_REQUEST", "Invalid campaign id.");
    }

    const rl = await rateLimit({
      key: `admin-ad-patch:${actor.id}`,
      windowMs: 60 * 1000,
      max: 60,
    });
    if (!rl.ok) {
      throw new ApiError("RATE_LIMITED", "Too many review actions.", {
        retryAfterSeconds: rl.retryAfterSeconds,
      });
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action;
    const reason =
      typeof body?.reason === "string" ? body.reason.slice(0, 500) : "";

    await connectToDatabase();
    const campaign = await AdCampaign.findById(id);
    if (!campaign) throw new ApiError("NOT_FOUND", "Campaign not found.");

    const before = {
      status: campaign.status,
      paymentStatus: campaign.paymentStatus,
    };
    let notify: "approved" | "rejected" | null = null;

    switch (action) {
      case "approve": {
        if (campaign.status !== "pending_review") {
          throw new ApiError(
            "CONFLICT",
            "Only a campaign awaiting review can be approved.",
          );
        }
        // Last gate on flat-rate inventory. Two campaigns can sit in the queue
        // for the same fortnight — the submit check saw an open slot for each
        // because neither was approved yet. Approving both is what actually
        // oversells the placement, so the count is re-taken here, with the
        // reviewer told plainly rather than being allowed to double-book.
        const slot = await getSlotAvailability(
          campaign.placement,
          campaign.startDate,
          campaign.endDate,
          String(campaign._id),
        );
        if (!slot.isAvailable) {
          throw new ApiError(
            "CONFLICT",
            `Approving this would oversell the ${AD_PLACEMENTS[campaign.placement as AdPlacement]?.name ?? campaign.placement} slot — all ${slot.capacity} spots are already booked for ${new Date(campaign.startDate).toLocaleDateString()}–${new Date(campaign.endDate).toLocaleDateString()}. Reject it with a note suggesting new dates, or free a slot first.`,
          );
        }
        campaign.status = "approved";
        campaign.reviewNote = "";
        notify = "approved";
        break;
      }

      case "reject": {
        if (campaign.status !== "pending_review") {
          throw new ApiError(
            "CONFLICT",
            "Only a campaign awaiting review can be rejected.",
          );
        }
        if (!reason) {
          throw new ApiError(
            "VALIDATION_FAILED",
            "Give a reason — the advertiser sees it and needs to know what to fix.",
          );
        }
        campaign.status = "rejected";
        campaign.reviewNote = reason;
        notify = "rejected";
        break;
      }

      case "pause": {
        if (campaign.status !== "active" && campaign.status !== "approved") {
          throw new ApiError("CONFLICT", "Only a live campaign can be paused.");
        }
        campaign.status = "paused";
        if (reason) campaign.reviewNote = reason;
        break;
      }

      case "resume": {
        if (campaign.status !== "paused") {
          throw new ApiError("CONFLICT", "This campaign isn't paused.");
        }
        campaign.status = "approved";
        break;
      }

      case "mark_paid": {
        if (campaign.paymentStatus === "paid") {
          return NextResponse.json({ ok: true, unchanged: true });
        }
        campaign.paymentStatus = "paid";
        campaign.paidAt = new Date();
        // Same fairness rule as the card path: an invoice settled after the
        // booked start date still buys the full number of days.
        startClockOnPayment(campaign);
        break;
      }

      case "refund": {
        if (campaign.paymentStatus !== "paid") {
          throw new ApiError("CONFLICT", "This campaign hasn't been paid.");
        }
        // Marks OUR books only — the money itself is refunded in the Razorpay
        // dashboard. Stopping delivery is the part that has to happen here.
        campaign.paymentStatus = "refunded";
        campaign.status = "paused";
        if (reason) campaign.reviewNote = reason;
        break;
      }

      default:
        throw new ApiError(
          "BAD_REQUEST",
          'action must be one of "approve", "reject", "pause", "resume", "mark_paid", or "refund".',
        );
    }

    campaign.reviewedBy = actor.objectId;
    campaign.reviewedAt = new Date();
    await campaign.save();

    // An approval that lands after the start date should begin delivering now.
    if (action === "approve" || action === "mark_paid" || action === "resume") {
      await syncCampaignSchedules();
    }

    await logAdminAction({
      actor,
      action: `ad.${action}` as any,
      targetType: "campaign",
      targetId: String(campaign._id),
      targetLabel: `${campaign.name} (${formatCents(campaign.priceCents)}, ${campaign.days}d ${campaign.placement})`,
      before,
      after: {
        status: campaign.status,
        paymentStatus: campaign.paymentStatus,
      },
      reason,
      req,
    });

    // Fire-and-forget: the advertiser should hear about a decision, but a mail
    // outage must not roll back the decision itself.
    if (notify) {
      const advertiser = await User.findById(campaign.advertiser).select(
        "email name",
      );
      const to = campaign.contactEmail || advertiser?.email;
      if (to) {
        const tpl = adDecisionEmail({
          name: advertiser?.name || "there",
          campaignName: campaign.name,
          decision: notify,
          reason,
          price: formatCents(campaign.priceCents),
          days: campaign.days,
          placement:
            AD_PLACEMENTS[campaign.placement as AdPlacement]?.name ?? campaign.placement,
          startDate: new Date(campaign.startDate).toLocaleDateString("en-US", {
            dateStyle: "medium",
            timeZone: "UTC",
          }),
        });
        void sendEmail({
          to,
          subject: tpl.subject,
          html: tpl.html,
          tag: "ad-decision",
        }).catch((err) =>
          console.error("[ads] decision email failed:", err),
        );
      }
    }

    return NextResponse.json({
      ok: true,
      status: campaign.status,
      paymentStatus: campaign.paymentStatus,
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
