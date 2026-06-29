"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FaCheck } from "react-icons/fa";
import CheckoutButton from "@/components/payments/CheckoutButton";
import {
  PLANS,
  type BillingCycle,
  type PlanConfig,
  type PlanId,
} from "@/config/plans";

const PLAN_RANK: Record<PlanId, number> = { free: 0, pro: 1, business: 2 };

function formatMoney(n: number, currency = "USD"): string {
  // Whole-number prices stay short ("$15"); decimal prices show cents ("$12.50").
  const symbol = currency === "USD" ? "$" : "";
  return n % 1 === 0
    ? `${symbol}${n}`
    : `${symbol}${n.toFixed(2)}`;
}

/** Effective per-month price for a billing cycle. */
function perMonth(plan: PlanConfig, cycle: BillingCycle): number {
  if (cycle === "monthly") return plan.priceMonthly;
  return plan.priceYearly ? plan.priceYearly / 12 : plan.priceMonthly;
}

/** Percent saved on yearly vs paying monthly for 12 months. */
function yearlySavingsPercent(plan: PlanConfig): number {
  const yearlyEquivOfMonthly = plan.priceMonthly * 12;
  if (!plan.priceYearly || yearlyEquivOfMonthly === 0) return 0;
  return Math.round(
    ((yearlyEquivOfMonthly - plan.priceYearly) / yearlyEquivOfMonthly) * 100,
  );
}

/** Pricing card */
function PlanCard({
  plan,
  cycle,
  variant,
  emphasis,
  currentPlanId,
  successHref,
  paymentsEnabled,
}: {
  plan: PlanConfig;
  cycle: BillingCycle;
  variant: "free" | "pro" | "business";
  emphasis?: boolean;
  /** When set, the card renders in logged-in mode (marks the current plan). */
  currentPlanId?: PlanId;
  successHref?: string;
  /** When false, paid plans show "Coming soon" instead of a live checkout. */
  paymentsEnabled?: boolean;
}) {
  const loggedIn = currentPlanId !== undefined;
  const isCurrent = currentPlanId === plan.id;
  const monthly = plan.priceMonthly;
  const effective = perMonth(plan, cycle);
  const yearlyTotal = plan.priceYearly ?? 0;
  // Boolean() guards against the `0 && X → 0` React rendering trap when
  // a plan has priceYearly === 0 (e.g. Free).
  const showStrike = Boolean(
    cycle === "yearly" && plan.priceYearly && effective < monthly,
  );
  const isFree = variant === "free";

  const dotColor =
    variant === "pro"
      ? "bg-blue-500"
      : variant === "business"
        ? "bg-purple-500"
        : "bg-green-500";

  const cardClass = emphasis
    ? "relative bg-white dark:bg-dark-100 border-2 border-blue-500 rounded-2xl p-8 shadow-2xl flex flex-col md:scale-105 z-10"
    : "bg-gray-50 dark:bg-dark-100 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 flex flex-col";

  return (
    <div className={cardClass}>
      {emphasis && (
        <div className="absolute -top-3 right-6 bg-blue-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
          Most popular
        </div>
      )}

      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {plan.name}
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6 min-h-[3rem]">
        {plan.description}
      </p>

      {/* PRICE BLOCK */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          {showStrike && (
            <span
              className="text-xl font-semibold text-gray-400 dark:text-gray-500 line-through decoration-2"
              aria-hidden="true"
            >
              {formatMoney(monthly)}
            </span>
          )}
          <span className="text-4xl font-bold text-gray-900 dark:text-white">
            {formatMoney(effective)}
          </span>
          <span className="text-lg font-normal text-gray-500 dark:text-gray-400">
            /month
          </span>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 min-h-[1.25rem]">
          {isFree ? (
            "Forever free. No credit card required."
          ) : cycle === "yearly" && plan.priceYearly ? (
            <>
              Billed as{" "}
              <strong className="text-gray-700 dark:text-gray-300">
                {formatMoney(yearlyTotal)}/year
              </strong>
              {showStrike && (
                <>
                  {" "}
                  ·{" "}
                  <span className="text-green-600 dark:text-green-400 font-semibold">
                    save {formatMoney(monthly * 12 - yearlyTotal)}
                  </span>
                </>
              )}
            </>
          ) : (
            <>Billed monthly. Switch to yearly to save.</>
          )}
        </p>
      </div>

      <ul className="space-y-3 mb-8 text-gray-700 dark:text-gray-300">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start">
            <span className={`mt-1 mr-2 h-2 w-2 rounded-full ${dotColor}`} />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto space-y-2">
        {isCurrent ? (
          <div className="flex w-full items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-green-500 text-green-700 dark:text-green-400 font-semibold">
            <FaCheck /> Current plan
          </div>
        ) : isFree ? (
          loggedIn ? (
            <div className="w-full text-center px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 font-medium">
              Free plan
            </div>
          ) : (
            <Link
              href="/auth/signin"
              className="block w-full text-center px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              Continue with Free
            </Link>
          )
        ) : paymentsEnabled === false ? (
          <div className="w-full text-center px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-medium">
            Coming soon
          </div>
        ) : (
          <>
            <CheckoutButton
              plan={plan.id}
              cycle={cycle}
              successHref={successHref}
              label={`${
                loggedIn
                  ? PLAN_RANK[plan.id] > PLAN_RANK[currentPlanId!]
                    ? "Upgrade to"
                    : "Switch to"
                  : "Get"
              } ${plan.name} · ${
                cycle === "yearly"
                  ? `${formatMoney(yearlyTotal)}/yr`
                  : `${formatMoney(monthly)}/mo`
              }`}
              className={
                variant === "business"
                  ? "block w-full px-6 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-semibold disabled:opacity-60"
                  : "block w-full px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-60"
              }
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-1">
              Secure checkout via Razorpay. Cancel any time.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function PricingCards({
  currentPlanId,
  successHref,
  paymentsEnabled = true,
}: {
  /** Pass the signed-in user's plan to render the in-app "manage plan" view. */
  currentPlanId?: PlanId;
  successHref?: string;
  /** When false, paid plans render "Coming soon" instead of live checkout. */
  paymentsEnabled?: boolean;
} = {}) {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");

  // Compute the largest savings % across the paid plans so we can advertise it
  // on the toggle without exaggerating.
  const headlineSavings = useMemo(() => {
    const candidates = [PLANS.pro, PLANS.business].map(yearlySavingsPercent);
    return Math.max(0, ...candidates);
  }, []);

  return (
    <>
      {/* BILLING CYCLE TOGGLE */}
      <div className="flex justify-center mb-12">
        <div
          role="tablist"
          aria-label="Billing cycle"
          className="relative grid grid-cols-2 p-1 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 w-[320px]"
        >
          {/* Sliding pill — anchored with left/right so equal-width grid cells
              always get a perfectly-aligned highlight, no matter what extras
              (badges, icons) live inside each tab. */}
          <span
            aria-hidden="true"
            className={`absolute top-1 bottom-1 rounded-full bg-white dark:bg-dark-100 shadow-md transition-all duration-300 ease-out ${
              cycle === "monthly"
                ? "left-1 right-[calc(50%+0.25rem)]"
                : "left-[calc(50%+0.25rem)] right-1"
            }`}
          />

          <button
            role="tab"
            aria-selected={cycle === "monthly"}
            type="button"
            onClick={() => setCycle("monthly")}
            className={`relative z-10 px-3 py-2 text-sm font-semibold rounded-full transition-colors text-center ${
              cycle === "monthly"
                ? "text-gray-900 dark:text-white"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            Monthly
          </button>

          <button
            role="tab"
            aria-selected={cycle === "yearly"}
            type="button"
            onClick={() => setCycle("yearly")}
            className={`relative z-10 px-3 py-2 text-sm font-semibold rounded-full transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap ${
              cycle === "yearly"
                ? "text-gray-900 dark:text-white"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            Yearly
            {headlineSavings > 0 && (
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase leading-none ${
                  cycle === "yearly"
                    ? "bg-green-600 text-white"
                    : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                }`}
              >
                -{headlineSavings}%
              </span>
            )}
          </button>
        </div>
      </div>

      {/* CARDS */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        <PlanCard
          plan={PLANS.free}
          cycle={cycle}
          variant="free"
          currentPlanId={currentPlanId}
          successHref={successHref}
          paymentsEnabled={paymentsEnabled}
        />
        <PlanCard
          plan={PLANS.pro}
          cycle={cycle}
          variant="pro"
          emphasis
          currentPlanId={currentPlanId}
          successHref={successHref}
          paymentsEnabled={paymentsEnabled}
        />
        <PlanCard
          plan={PLANS.business}
          cycle={cycle}
          variant="business"
          currentPlanId={currentPlanId}
          successHref={successHref}
          paymentsEnabled={paymentsEnabled}
        />
      </div>
    </>
  );
}
