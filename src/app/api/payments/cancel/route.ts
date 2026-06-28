import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Subscription } from "@/models/Subscription";
import { getRazorpayClient } from "@/lib/payments/razorpay";
import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { rateLimit } from "@/lib/rateLimit";

/**
 * Cancel an active subscription. By default the cancellation is scheduled
 * for the end of the current billing cycle (`cancel_at_cycle_end: 1`), so
 * the user keeps access until then. Pass `immediate: true` to cancel now.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      throw new ApiError("UNAUTHENTICATED", "Sign in required.");
    }

    const rl = await rateLimit({
      key: `cancel-sub:${session.user._id}`,
      windowMs: 60_000,
      max: 5,
    });
    if (!rl.ok) {
      throw new ApiError("RATE_LIMITED", "Too many cancellation attempts.", {
        retryAfterSeconds: rl.retryAfterSeconds,
      });
    }

    const body = (await req.json().catch(() => ({}))) as {
      immediate?: boolean;
    };

    await connectToDatabase();

    const user = await User.findById(session.user._id);
    if (!user) {
      throw new ApiError("NOT_FOUND", "User account not found.");
    }
    if (!user.razorpaySubscriptionId) {
      throw new ApiError("NOT_FOUND", "No active subscription to cancel.");
    }

    const subscription = await Subscription.findOne({
      user: session.user._id,
      providerSubscriptionId: user.razorpaySubscriptionId,
    });
    if (!subscription) {
      throw new ApiError("NOT_FOUND", "Subscription record not found.");
    }
    if (
      subscription.status === "canceled" ||
      subscription.status === "expired"
    ) {
      throw new ApiError("CONFLICT", "Subscription is already canceled.");
    }

    const razorpay = getRazorpayClient();
    const cancelled = await razorpay.subscriptions.cancel(
      user.razorpaySubscriptionId,
      body.immediate ? false : true, // 2nd arg: cancel_at_cycle_end (default: true)
    );

    subscription.status = "canceled";
    subscription.canceledAt = new Date();
    subscription.endsAt = body.immediate
      ? new Date()
      : subscription.currentPeriodEnd ?? new Date();
    await subscription.save();

    // The webhook will also fire `subscription.cancelled` and finalize the
    // user.plan downgrade after the access period ends. We don't downgrade
    // here so the user retains access through their paid window.
    user.planStatus = "canceled";
    await user.save();

    return Response.json({
      ok: true,
      endsAt: subscription.endsAt,
      status: cancelled?.status ?? "cancelled",
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
