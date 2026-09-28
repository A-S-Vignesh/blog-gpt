import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { FaPlus, FaChartLine } from "react-icons/fa";
import { authOptions } from "@/lib/authOptions";
import { getAdvertiserOverview, listMyCampaigns } from "@/lib/data/ads";
import AdvertiserDashboard from "@/components/ads/AdvertiserDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your campaigns | The Blog GPT",
  robots: { index: false, follow: false },
};

export default async function AdvertiserDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?._id) {
    redirect("/auth/signin?callbackUrl=%2Fadvertise%2Fdashboard");
  }

  const [overview, campaigns] = await Promise.all([
    getAdvertiserOverview(session.user._id),
    listMyCampaigns(session.user._id, { limit: 20 }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-dark-100">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
              <FaChartLine className="text-blue-600" />
              Your campaigns
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Everything you&apos;re running on The Blog GPT, and how it&apos;s
              performing.
            </p>
          </div>
          <Link
            href="/advertise/new"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-700"
          >
            <FaPlus /> New campaign
          </Link>
        </header>

        <AdvertiserDashboard
          overview={overview}
          initialCampaigns={campaigns}
        />
      </div>
    </div>
  );
}
