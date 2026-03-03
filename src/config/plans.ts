export type PlanId = "free" | "pro" | "business";

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
  razorpayPlanId?: string;
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
    razorpayPlanId: "",
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
    razorpayPlanId: "",
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
      "Analytics dashboard (coming soon)",
      "Bulk AI generation (coming soon)",
      "Priority support",
    ],
    razorpayPlanId: "",
  },
};

export const DEFAULT_PLAN_ID: PlanId = "free";

export const getPlanById = (id: string): PlanConfig => {
  const key = id as PlanId;
  return PLANS[key] ?? PLANS.free;
};

