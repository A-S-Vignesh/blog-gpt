import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Subscription } from "@/models/Subscription";
import PaymentEvent from "@/models/PaymentEvent";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";
import { resolveRazorpayPlan, PLANS, type PlanId } from "@/config/plans";
import { sendEmail } from "@/lib/email/send";
import {
  subscriptionActivatedEmail,
  paymentFailedEmail,
  subscriptionCanceledEmail,
} from "@/lib/email/templates";

// Force Node runtime — we need the raw body for HMAC verification.
export const runtime = "nodejs";

type RazorpaySubscriptionEntity = {
  id: string;
  plan_id: string;
  status: string;
  current_start?: number;
  current_end?: number;
  end_at?: number;
  customer_id?: string;
  notes?: { userId?: string; appPlan?: string; cycle?: string };
};

type RazorpayWebhookBody = {
  event: string;
  payload: {
    subscription?: { entity: RazorpaySubscriptionEntity };
    payment?: {
      entity: {
        id: string;
        status: string;
        amount: number;
        currency: string;
        subscription_id?: string;
      };
    };
  };
  created_at?: number;
};

export async function POST(req: Request) {
  // 1. Verify signature against raw body BEFORE any DB work.
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";
  if (!verifyWebhookSignature({ rawBody, signature })) {
    console.warn("[razorpay-webhook] signature verification failed");
    return new NextResponse("Invalid signature", { status: 401 });
  }

  let body: RazorpayWebhookBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  const eventType = body.event;
  // Razorpay does not always include an event id — fall back to a deterministic
  // composite key so we still get idempotency for the common events.
  const providerEventId =
    (req.headers.get("x-razorpay-event-id") as string | null) ||
    deriveEventKey(body);

  try {
    await connectToDatabase();

    // 2. Idempotency check.
    const existing = await PaymentEvent.findOne({ providerEventId });
    if (existing) {
      return NextResponse.json({ received: true, deduped: true });
    }

    let userId: string | null = null;
    let subscriptionDocId: string | null = null;

    switch (eventType) {
      case "subscription.activated":
      case "subscription.charged":
        ({ userId, subscriptionDocId } = await handleActivation(body));
        break;
      case "subscription.cancelled":
        ({ userId, subscriptionDocId } = await handleCancellation(body));
        break;
      case "subscription.paused":
      case "subscription.halted":
        ({ userId, subscriptionDocId } = await handleHalt(body));
        break;
      case "payment.failed":
        ({ userId } = await handlePaymentFailed(body));
        break;
      default:
        // Unknown event — log it but still mark processed so we don't loop.
        console.info(`[razorpay-webhook] unhandled event: ${eventType}`);
    }

    // 3. Record event so retries / duplicates are no-ops.
    await PaymentEvent.create({
      providerEventId,
      eventType,
      user: userId,
      subscription: subscriptionDocId,
      payload: body as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[razorpay-webhook] processing error:", err);
    // Returning 500 will cause Razorpay to retry. That's what we want for
    // transient failures — the idempotency log prevents duplicate effects.
    return new NextResponse("Internal error", { status: 500 });
  }
}

function deriveEventKey(body: RazorpayWebhookBody): string {
  const subId = body.payload.subscription?.entity.id ?? "no-sub";
  const payId = body.payload.payment?.entity.id ?? "no-pay";
  return `${body.event}:${subId}:${payId}:${body.created_at ?? ""}`;
}

async function handleActivation(body: RazorpayWebhookBody) {
  const entity = body.payload.subscription?.entity;
  if (!entity) return { userId: null, subscriptionDocId: null };

  const resolved = resolveRazorpayPlan(entity.plan_id);
  if (!resolved) {
    console.warn("[razorpay-webhook] unknown plan id:", entity.plan_id);
    return { userId: null, subscriptionDocId: null };
  }

  const sub = await Subscription.findOne({ providerSubscriptionId: entity.id });
  if (!sub) {
    console.warn(
      "[razorpay-webhook] subscription not found for id:",
      entity.id,
    );
    return { userId: null, subscriptionDocId: null };
  }

  const periodStart = entity.current_start
    ? new Date(entity.current_start * 1000)
    : null;
  const periodEnd = entity.current_end
    ? new Date(entity.current_end * 1000)
    : null;

  sub.status = "active";
  sub.providerCustomerId = entity.customer_id ?? sub.providerCustomerId;
  sub.currentPeriodStart = periodStart;
  sub.currentPeriodEnd = periodEnd;
  await sub.save();

  const user = await User.findById(sub.user);
  if (user) {
    const wasAlreadyActive =
      user.plan === resolved.plan && user.planStatus === "active";
    user.plan = resolved.plan;
    user.planStatus = "active";
    user.planRenewsAt = periodEnd;
    user.razorpaySubscriptionId = entity.id;
    user.razorpayCustomerId = entity.customer_id ?? user.razorpayCustomerId;
    // Reset usage counter on plan upgrade or renewal so the new monthly quota
    // is fresh. (Razorpay sends `subscription.charged` on every renewal.)
    user.aiGenerationCount = 0;
    user.aiUsagePeriodStart = new Date();
    await user.save();

    if (!wasAlreadyActive) {
      const planCfg = PLANS[resolved.plan];
      const tpl = subscriptionActivatedEmail({
        planName: planCfg.name,
        amount:
          resolved.cycle === "monthly"
            ? planCfg.priceMonthly
            : planCfg.priceYearly ?? planCfg.priceMonthly * 12,
        currency: planCfg.currency,
        renewsAt: periodEnd,
      });
      void sendEmail({
        to: user.email,
        subject: tpl.subject,
        html: tpl.html,
        tag: "subscription-activated",
      });
    }

    return { userId: user._id.toString(), subscriptionDocId: sub._id.toString() };
  }
  return { userId: null, subscriptionDocId: sub._id.toString() };
}

async function handleCancellation(body: RazorpayWebhookBody) {
  const entity = body.payload.subscription?.entity;
  if (!entity) return { userId: null, subscriptionDocId: null };

  const sub = await Subscription.findOne({
    providerSubscriptionId: entity.id,
  }).populate<{ user: { email: string; name: string; _id: any } }>(
    "user",
    "email name",
  );
  if (!sub) return { userId: null, subscriptionDocId: null };

  sub.status = "canceled";
  sub.canceledAt = new Date();
  if (entity.end_at) {
    sub.endsAt = new Date(entity.end_at * 1000);
  } else if (sub.currentPeriodEnd) {
    sub.endsAt = sub.currentPeriodEnd;
  }
  await sub.save();

  const user = await User.findById(sub.user);
  if (user) {
    user.planStatus = "canceled";
    // Keep `user.plan` as-is — they should retain access until `endsAt`.
    // A separate scheduled job downgrades to "free" after endsAt passes.
    await user.save();

    const planCfg = PLANS[sub.plan as PlanId];
    const tpl = subscriptionCanceledEmail({
      planName: planCfg.name,
      accessUntil: sub.endsAt ?? null,
    });
    void sendEmail({
      to: user.email,
      subject: tpl.subject,
      html: tpl.html,
      tag: "subscription-canceled",
    });
    return { userId: user._id.toString(), subscriptionDocId: sub._id.toString() };
  }
  return { userId: null, subscriptionDocId: sub._id.toString() };
}

async function handleHalt(body: RazorpayWebhookBody) {
  const entity = body.payload.subscription?.entity;
  if (!entity) return { userId: null, subscriptionDocId: null };

  const sub = await Subscription.findOne({ providerSubscriptionId: entity.id });
  if (!sub) return { userId: null, subscriptionDocId: null };

  sub.status = entity.status === "paused" ? "paused" : "halted";
  await sub.save();

  const user = await User.findById(sub.user);
  if (user) {
    user.planStatus = "past_due";
    await user.save();
    return { userId: user._id.toString(), subscriptionDocId: sub._id.toString() };
  }
  return { userId: null, subscriptionDocId: sub._id.toString() };
}

async function handlePaymentFailed(body: RazorpayWebhookBody) {
  const subId = body.payload.payment?.entity.subscription_id;
  if (!subId) return { userId: null };

  const sub = await Subscription.findOne({ providerSubscriptionId: subId });
  if (!sub) return { userId: null };

  sub.status = "past_due";
  await sub.save();

  const user = await User.findById(sub.user);
  if (user) {
    user.planStatus = "past_due";
    await user.save();

    const tpl = paymentFailedEmail({ planName: PLANS[sub.plan as PlanId].name });
    void sendEmail({
      to: user.email,
      subject: tpl.subject,
      html: tpl.html,
      tag: "payment-failed",
    });
    return { userId: user._id.toString() };
  }
  return { userId: null };
}
