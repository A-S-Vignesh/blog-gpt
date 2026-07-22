import { Metadata } from "next";
import LargeFooter from "@/components/LargeFooter";
import PricingCards from "@/components/pricing/PricingCards";
import { isPaymentsEnabled } from "@/lib/payments/razorpay";

export const metadata: Metadata = {
  title: "Pricing | The Blog GPT",
  description:
    "Choose the right plan for your AI-powered blogging workflow. Start free, then upgrade when you need more power.",
  alternates: { canonical: "https://thebloggpt.com/pricing" },
};

export default function PricingPage() {
  const paymentsEnabled = isPaymentsEnabled();
  return (
    <>
      <section className="py-16 px-6 sm:px-16 md:px-20 lg:px-28 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Simple pricing{" "}
            <span className="text-blue-600 dark:text-blue-400">
              for creators
            </span>
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
            {paymentsEnabled
              ? "Start free. Upgrade any time. Cancel any time."
              : "Start free today. Paid plans are launching soon."}
          </p>
        </div>
      </section>

      <section className="py-16 px-6 sm:px-16 md:px-20 lg:px-28 bg-white dark:bg-dark-100">
        <PricingCards paymentsEnabled={paymentsEnabled} />

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
