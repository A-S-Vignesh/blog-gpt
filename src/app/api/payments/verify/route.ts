import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import { Subscription } from "@/models/Subscription";
import { verifyCheckoutSignature } from "@/lib/payments/razorpay";
import { ApiError, apiErrorResponse } from "@/lib/api/errors";

/**
 * Called from the browser by Razorpay Checkout after the user authenticates
 * a subscription. We only mark the subscription as `authenticated` here —
 * the actual `plan` field on the user is updated by the webhook, which is
 * the trusted source of truth (the client could spoof this endpoint).
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      throw new ApiError("UNAUTHENTICATED", "Sign in required.");
    }

    const body = (await req.json().catch(() => null)) as {
      razorpay_subscription_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    } | null;

    if (
      !body?.razorpay_subscription_id ||
      !body.razorpay_payment_id ||
      !body.razorpay_signature
    ) {
      throw new ApiError("BAD_REQUEST", "Missing Razorpay response fields.");
    }

    const ok = verifyCheckoutSignature({
      subscriptionId: body.razorpay_subscription_id,
      paymentId: body.razorpay_payment_id,
      signature: body.razorpay_signature,
    });
    if (!ok) {
      throw new ApiError(
        "FORBIDDEN",
        "Payment signature verification failed. Payment was NOT applied.",
      );
    }

    await connectToDatabase();
    const sub = await Subscription.findOne({
      providerSubscriptionId: body.razorpay_subscription_id,
      user: session.user._id,
    });
    if (!sub) {
      throw new ApiError("NOT_FOUND", "Subscription record not found.");
    }

    if (sub.status === "created") {
      sub.status = "authenticated";
      await sub.save();
    }

    return Response.json({
      ok: true,
      message:
        "Payment verified. Your plan will activate within a few seconds.",
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
