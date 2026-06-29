import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Subscription } from "@/models/Subscription";
import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { rateLimit } from "@/lib/rateLimit";
import { sendEmail } from "@/lib/email/send";
import { accountDeletionInitiatedEmail } from "@/lib/email/templates";
import { getRazorpayClient } from "@/lib/payments/razorpay";
import { randomBytes, createHash } from "crypto";

/**
 * Grace period before the account is permanently deleted.
 * The user can cancel the deletion within this window from the email link
 * or from settings.
 */
const GRACE_PERIOD_DAYS = 7;
const GRACE_PERIOD_MS = GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      throw new ApiError("UNAUTHENTICATED", "Sign in required.");
    }
    const userId = session.user._id;

    const rl = await rateLimit({
      key: `delete-acct:${userId}`,
      windowMs: 60 * 60 * 1000,
      max: 3,
    });
    if (!rl.ok) {
      throw new ApiError(
        "RATE_LIMITED",
        "Too many deletion attempts. Try again later.",
        { retryAfterSeconds: rl.retryAfterSeconds },
      );
    }

    const body = (await req.json().catch(() => ({}))) as {
      confirmation?: string;
    };

    await connectToDatabase();
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError("NOT_FOUND", "User account not found.");
    }

    // Confirmation requirement: user must type their username verbatim.
    // This makes accidental clicks impossible.
    if (body.confirmation !== user.username) {
      throw new ApiError(
        "VALIDATION_FAILED",
        "Confirmation does not match your username.",
        { expected: "your username" },
      );
    }

    if (user.deletionScheduledFor) {
      // Idempotency: already scheduled — return current state instead of erroring.
      return Response.json({
        ok: true,
        alreadyScheduled: true,
        scheduledFor: user.deletionScheduledFor,
      });
    }

    // Cancel any active Razorpay subscription so the user doesn't get
    // charged again during the grace window. We cancel at cycle-end so they
    // retain paid features until access naturally lapses.
    if (user.razorpaySubscriptionId) {
      try {
        const razorpay = getRazorpayClient();
        await razorpay.subscriptions.cancel(user.razorpaySubscriptionId, true);
        await Subscription.updateOne(
          { providerSubscriptionId: user.razorpaySubscriptionId },
          { $set: { status: "canceled", canceledAt: new Date() } },
        );
      } catch (err) {
        // Don't fail deletion just because subscription cancel failed.
        // Surface it in logs and let the operator clean up if needed.
        console.error(
          "[account-delete] failed to cancel Razorpay subscription:",
          err,
        );
      }
    }

    const scheduledFor = new Date(Date.now() + GRACE_PERIOD_MS);
    // High-entropy token: the RAW value goes in the email; only its SHA-256
    // hash is stored, so a DB read/leak can't be used to cancel a deletion.
    const cancelToken = randomBytes(32).toString("hex");
    const hashedToken = createHash("sha256").update(cancelToken).digest("hex");

    user.deletionScheduledFor = scheduledFor;
    user.deletionCancelToken = hashedToken;
    user.deletionRequestedAt = new Date();
    user.planStatus = "canceled";
    await user.save();

    const tpl = accountDeletionInitiatedEmail({
      name: user.name,
      scheduledFor,
      cancelToken,
    });
    void sendEmail({
      to: user.email,
      subject: tpl.subject,
      html: tpl.html,
      tag: "account-deletion-initiated",
    });

    return Response.json({
      ok: true,
      scheduledFor,
      gracePeriodDays: GRACE_PERIOD_DAYS,
      message:
        "Your account is scheduled for permanent deletion. You can cancel any time within the next 7 days from the link we just emailed you.",
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
