import { Metadata } from "next";
import Link from "next/link";
import { PLANS } from "@/config/plans";
import LargeFooter from "@/components/LargeFooter";

export const metadata: Metadata = {
  title: "Pricing | The Blog GPT",
  description:
    "Choose the right plan for your AI-powered blogging workflow. Start free, then upgrade when you need more power.",
};

export default function PricingPage() {
  const freePlan = PLANS.free;
  const proPlan = PLANS.pro;
  const businessPlan = PLANS.business;

  return (
    <>
      <section className="py-16 px-6 sm:px-16 md:px-20 lg:px-28 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Simple pricing
            <span className="text-blue-600 dark:text-blue-400">
              for creators
            </span>
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
            Start with the free plan, validate your content workflow, and
            upgrade to a paid plan later when you are ready. Payments are coming
            soon.
          </p>
        </div>
      </section>

      <section className="py-16 px-6 sm:px-16 md:px-20 lg:px-28 bg-white dark:bg-dark-100">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Free plan */}
          <div className="bg-gray-50 dark:bg-dark-100 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 flex flex-col">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {freePlan.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {freePlan.description}
            </p>
            <p className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
              ${freePlan.priceMonthly}
              <span className="text-lg font-normal text-gray-500 dark:text-gray-400">
                /month
              </span>
            </p>

            <ul className="space-y-3 mb-8 text-gray-700 dark:text-gray-300">
              {freePlan.features.map((feature) => (
                <li key={feature} className="flex items-start">
                  <span className="mt-1 mr-2 h-2 w-2 rounded-full bg-green-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto">
              <Link
                href="/auth/signin"
                className="block w-full text-center px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                Continue with Free
              </Link>
            </div>
          </div>

          {/* Pro plan */}
          <div className="relative bg-white dark:bg-dark-100 border-2 border-blue-500 rounded-2xl p-8 shadow-2xl flex flex-col scale-105 md:scale-110 z-10">
            <div className="absolute -top-3 right-6 bg-blue-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
              Most popular · Coming soon
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {proPlan.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {proPlan.description}
            </p>
            <p className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
              ${proPlan.priceMonthly}
              <span className="text-lg font-normal text-gray-500 dark:text-gray-400">
                /month
              </span>
            </p>
            {proPlan.priceYearly && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                or ${proPlan.priceYearly}/year{" "}
                <span className="font-semibold">(2 months free)</span>
              </p>
            )}

            <ul className="space-y-3 mb-8 text-gray-700 dark:text-gray-300">
              {proPlan.features.map((feature) => (
                <li key={feature} className="flex items-start">
                  <span className="mt-1 mr-2 h-2 w-2 rounded-full bg-blue-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto space-y-2">
              <button
                type="button"
                disabled
                className="block w-full px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold opacity-70 cursor-not-allowed"
              >
                Upgrade to Pro (coming soon)
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Paid subscriptions will be available soon. For now, everyone is
                on the Free plan.
              </p>
            </div>
          </div>

          {/* Business plan */}
          <div className="bg-gray-50 dark:bg-dark-100 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 flex flex-col">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {businessPlan.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {businessPlan.description}
            </p>
            <p className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
              ${businessPlan.priceMonthly}
              <span className="text-lg font-normal text-gray-500 dark:text-gray-400">
                /month
              </span>
            </p>
            {businessPlan.priceYearly && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                or ${businessPlan.priceYearly}/year{" "}
                <span className="font-semibold">(2 months free)</span>
              </p>
            )}

            <ul className="space-y-3 mb-8 text-gray-700 dark:text-gray-300">
              {businessPlan.features.map((feature) => (
                <li key={feature} className="flex items-start">
                  <span className="mt-1 mr-2 h-2 w-2 rounded-full bg-purple-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto space-y-2">
              <button
                type="button"
                disabled
                className="block w-full px-6 py-3 rounded-xl bg-gray-800 text-white font-semibold opacity-60 cursor-not-allowed"
              >
                Business plan (coming soon)
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Ideal for agencies and teams once billing is live.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto mt-16 text-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            What happens when I hit the Free plan limit?
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Free users can generate up to 5 AI-powered blog posts per month.
            When you reach the limit, AI generation will pause until the next
            month or until you upgrade to a paid plan.
          </p>
        </div>
      </section>

      <LargeFooter />
    </>
  );
}

