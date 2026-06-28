import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Subscription } from "@/models/Subscription";
import {
  PLANS,
  getRazorpayPlanId,
  type PlanId,
  type BillingCycle,
} from "@/config/plans";
import {
  getRazorpayClient,
  getRazorpayPublicKey,
  isPaymentsEnabled,
} from "@/lib/payments/razorpay";
import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { rateLimit } from "@/lib/rateLimit";

const VALID_PLANS: PlanId[] = ["pro", "business"];
const VALID_CYCLES: BillingCycle[] = ["monthly", "yearly"];

export async function POST(req: Request) {
  try {
    // Payments not configured yet → fail clean instead of throwing a 500 from
    // getRazorpayClient(). The UI also hides the upgrade CTA in this state.
    if (!isPaymentsEnabled()) {
      throw new ApiError(
        "FORBIDDEN",
        "Paid plans aren't available just yet. Please check back soon.",
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?._id || !session.user.email) {
      throw new ApiError("UNAUTHENTICATED", "You must be signed in to subscribe.");
    }
    const userId = session.user._id;

    const rl = await rateLimit({
      key: `create-sub:${userId}`,
      windowMs: 60_000,
      max: 5,
    });
    if (!rl.ok) {
      throw new ApiError("RATE_LIMITED", "Too many checkout attempts.", {
        retryAfterSeconds: rl.retryAfterSeconds,
      });
    }

    const body = (await req.json().catch(() => null)) as {
      plan?: string;
      cycle?: string;
    } | null;
    if (!body) {
      throw new ApiError("BAD_REQUEST", "Invalid request body.");
    }

    const plan = body.plan as PlanId;
    const cycle = body.cycle as BillingCycle;

    if (!VALID_PLANS.includes(plan)) {
      throw new ApiError("BAD_REQUEST", "Unknown plan.");
    }
    if (!VALID_CYCLES.includes(cycle)) {
      throw new ApiError("BAD_REQUEST", "Unknown billing cycle.");
    }

    const razorpayPlanId = getRazorpayPlanId(plan, cycle);
    if (!razorpayPlanId) {
      throw new ApiError(
        "INTERNAL_ERROR",
        "This plan is not currently available. Please try again later.",
      );
    }

    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError("NOT_FOUND", "User account not found.");
    }

    // Already on a paid plan? Block duplicate subscriptions so we don't
    // double-charge. Customer must cancel first via /api/payments/cancel.
    if (user.plan && user.plan !== "free" && user.planStatus === "active") {
      throw new ApiError(
        "CONFLICT",
        "You already have an active subscription. Cancel the current one before upgrading.",
      );
    }

    const planCfg = PLANS[plan];
    const razorpay = getRazorpayClient();

    const subscription = await razorpay.subscriptions.create({
      plan_id: razorpayPlanId,
      customer_notify: 1,
      total_count: cycle === "yearly" ? 5 : 60, // 5 years yearly / 5 years monthly
      notes: {
        userId: String(userId),
        appPlan: plan,
        cycle,
      },
    });

    // Record the local subscription as `created` immediately so the webhook
    // has something to update by `providerSubscriptionId`.
    await Subscription.create({
      user: userId,
      providerSubscriptionId: subscription.id,
      providerPlanId: razorpayPlanId,
      plan,
      billingCycle: cycle,
      status: "created",
      amount:
        cycle === "monthly"
          ? planCfg.priceMonthly
          : planCfg.priceYearly ?? planCfg.priceMonthly * 12,
      currency: planCfg.currency,
    });

    return Response.json({
      subscriptionId: subscription.id,
      keyId: getRazorpayPublicKey(),
      planName: planCfg.name,
      amount:
        cycle === "monthly"
          ? planCfg.priceMonthly
          : planCfg.priceYearly ?? planCfg.priceMonthly * 12,
      currency: planCfg.currency,
      userName: user.name,
      userEmail: user.email,
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
