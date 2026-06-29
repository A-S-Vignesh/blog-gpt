export type PlanId = "free" | "pro" | "business";
export type BillingCycle = "monthly" | "yearly";

export interface PlanConfig {
  id: PlanId;
  name: string;
  priceMonthly: number;
  priceYearly?: number;
  currency: string;
  description: string;
  /**
   * Maximum AI generations per month.
   * null = unlimited.
   */
  aiGenerationsPerMonth: number | null;
  features: string[];
  /**
   * Razorpay plan ids configured in the dashboard for each billing cycle.
   * Leave empty string for plans that should not be purchasable yet.
   */
  razorpayPlanIds: {
    monthly: string;
    yearly: string;
  };
}

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    priceYearly: 0,
    currency: "USD",
    description: "Get started and try The Blog GPT with essential features.",
    aiGenerationsPerMonth: 5,
    features: [
      "Up to 5 AI-generated blog posts per month",
      "Basic SEO-friendly structure",
      "Standard image uploads",
    ],
    razorpayPlanIds: { monthly: "", yearly: "" },
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 15,
    priceYearly: 150,
    currency: "USD",
    description:
      "For serious creators and professionals who publish consistently.",
    aiGenerationsPerMonth: 150,
    features: [
      "150 AI generations per month",
      "Unlimited published posts under thebloggpt.com",
      "No TheBlogGPT branding badge",
      "Advanced SEO tools",
      "Standard support",
    ],
    razorpayPlanIds: {
      monthly: process.env.RAZORPAY_PLAN_PRO_MONTHLY || "",
      yearly: process.env.RAZORPAY_PLAN_PRO_YEARLY || "",
    },
  },
  business: {
    id: "business",
    name: "Business",
    priceMonthly: 39,
    priceYearly: 390,
    currency: "USD",
    description: "For agencies and teams that publish content at scale.",
    aiGenerationsPerMonth: 500,
    features: [
      "500 AI generations per month",
      "Unlimited published posts under thebloggpt.com",
      "Team access (up to 5 members)",
      "Priority support",
    ],
    razorpayPlanIds: {
      monthly: process.env.RAZORPAY_PLAN_BUSINESS_MONTHLY || "",
      yearly: process.env.RAZORPAY_PLAN_BUSINESS_YEARLY || "",
    },
  },
};

export const DEFAULT_PLAN_ID: PlanId = "free";

export const getPlanById = (id: string): PlanConfig => {
  const key = id as PlanId;
  return PLANS[key] ?? PLANS.free;
};

export const getRazorpayPlanId = (
  plan: PlanId,
  cycle: BillingCycle,
): string => {
  return PLANS[plan]?.razorpayPlanIds[cycle] || "";
};

/**
 * Map a Razorpay plan id back to our internal plan + billing cycle.
 * Used by the webhook handler where we only get the plan id.
 */
export const resolveRazorpayPlan = (
  razorpayPlanId: string,
): { plan: PlanId; cycle: BillingCycle } | null => {
  for (const [planId, config] of Object.entries(PLANS) as [
    PlanId,
    PlanConfig,
  ][]) {
    if (config.razorpayPlanIds.monthly === razorpayPlanId) {
      return { plan: planId, cycle: "monthly" };
    }
    if (config.razorpayPlanIds.yearly === razorpayPlanId) {
      return { plan: planId, cycle: "yearly" };
    }
  }
  return null;
};
