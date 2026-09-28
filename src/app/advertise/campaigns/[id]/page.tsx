import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getCampaignDetail } from "@/lib/data/ads";
import { isPaymentsEnabled } from "@/lib/payments/razorpay";
import CampaignDetailView from "@/components/ads/CampaignDetailView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Campaign | The Blog GPT",
  robots: { index: false, follow: false },
};

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?._id) {
    redirect("/auth/signin?callbackUrl=%2Fadvertise%2Fdashboard");
  }

  const { id } = await params;
  // Scoped to the owner inside getCampaignDetail — someone else's id throws
  // NOT_FOUND rather than leaking that the campaign exists.
  const detail = await getCampaignDetail(session.user._id, id);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-dark-100">
      <div className="mx-auto max-w-5xl">
        <CampaignDetailView
          detail={detail}
          paymentsEnabled={isPaymentsEnabled()}
        />
      </div>
    </div>
  );
}
