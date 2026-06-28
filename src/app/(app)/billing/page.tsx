import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Subscription } from "@/models/Subscription";
import { getPlanById, type PlanId } from "@/config/plans";
import { isPaymentsEnabled } from "@/lib/payments/razorpay";
import PricingCards from "@/components/pricing/PricingCards";
import CancelSubscriptionButton from "@/components/billing/CancelSubscriptionButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Billing & Plans | The Blog GPT",
  description: "Manage your subscription and upgrade your AI blogging workflow.",
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?._id) {
    redirect("/auth/signin?callbackUrl=%2Fbilling");
  }

  await connectToDatabase();
  const user = await User.findById(session.user._id)
    .select(
      "plan planStatus planRenewsAt aiGenerationCount aiExtraCredits razorpaySubscriptionId",
    )
    .lean<{
      plan?: PlanId;
      planStatus?: string;
      planRenewsAt?: Date | null;
      aiGenerationCount?: number;
      aiExtraCredits?: number;
      razorpaySubscriptionId?: string;
    }>();

  const planId: PlanId = user?.plan ?? "free";
  const plan = getPlanById(planId);
  const status = user?.planStatus ?? "active";

  // Pull the live subscription record so we can show the access-until date and
  // decide whether a cancel control should be offered.
  const sub = user?.razorpaySubscriptionId
    ? await Subscription.findOne({
        user: session.user._id,
        providerSubscriptionId: user.razorpaySubscriptionId,
      })
        .select("status endsAt currentPeriodEnd")
        .lean<{
          status?: string;
          endsAt?: Date | null;
          currentPeriodEnd?: Date | null;
        }>()
    : null;

  const canCancel =
    planId !== "free" && status === "active" && !!user?.razorpaySubscriptionId;
  const accessUntil =
    sub?.endsAt ?? sub?.currentPeriodEnd ?? user?.planRenewsAt ?? null;

  // A past_due subscription is metered against the FREE quota (matches the
  // generation routes), so the usage meter reflects the effective plan.
  const effectivePlan = getPlanById(status === "past_due" ? "free" : planId);
  const limit = effectivePlan.aiGenerationsPerMonth ?? 0;
  const used = user?.aiGenerationCount ?? 0;
  const extra = user?.aiExtraCredits ?? 0;
  const remaining = Math.max(limit - used, 0) + extra;
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  const { upgraded } = await searchParams;

  return (
    <div className="px-6 sm:px-10 md:px-16 py-10 max-w-6xl mx-auto">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
        Billing &amp; Plans
      </h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Manage your subscription and upgrade for more AI generations.
      </p>

      {upgraded && (
        <div className="mt-6 rounded-xl border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 px-4 py-3 text-sm text-green-800 dark:text-green-300">
          🎉 Payment received! Your new plan activates within a few seconds.
          Refresh this page if it hasn&apos;t updated yet.
        </div>
      )}

      {status === "past_due" && (
        <div className="mt-6 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          Your last payment failed, so you&apos;re temporarily on the Free quota.
          Re-subscribe below to restore {plan.name} features.
        </div>
      )}

      {/* Current plan + usage */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-100 p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Current plan
          </p>
          <div className="mt-1 flex items-center gap-3">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {plan.name}
            </span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                status === "active"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                  : status === "past_due"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              {status.replace("_", " ")}
            </span>
          </div>
          {status === "canceled" ? (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Canceled, access until{" "}
              {accessUntil
                ? new Date(accessUntil).toLocaleDateString()
                : "the end of your billing period"}
              , then your account moves to Free.
            </p>
          ) : (
            user?.planRenewsAt && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Renews on {new Date(user.planRenewsAt).toLocaleDateString()}
              </p>
            )
          )}

          {canCancel && <CancelSubscriptionButton />}
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-100 p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            AI generations this month
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {used}
            <span className="text-base font-normal text-gray-500 dark:text-gray-400">
              {" "}
              / {limit}
            </span>
          </p>
          <div className="mt-3 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-600"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {remaining} remaining
            {extra > 0 ? ` (includes ${extra} extra credits)` : ""}
          </p>
        </div>
      </div>

      {/* Plans */}
      <div className="mt-12">
        <PricingCards
          currentPlanId={planId}
          successHref="/billing?upgraded=1"
          paymentsEnabled={isPaymentsEnabled()}
        />
      </div>
    </div>
  );
}
