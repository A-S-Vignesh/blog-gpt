import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getCampaignDetail } from "@/lib/data/ads";
import { ApiError } from "@/lib/api/errors";
import CampaignBuilder from "@/components/ads/CampaignBuilder";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit campaign | The Blog GPT",
  robots: { index: false, follow: false },
};

export default async function EditCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?._id) {
    redirect(
      `/auth/signin?callbackUrl=${encodeURIComponent(`/advertise/campaigns/${id}/edit`)}`,
    );
  }

  let detail;
  try {
    detail = await getCampaignDetail(session.user._id, id);
  } catch (err) {
    if (err instanceof ApiError && err.code === "NOT_FOUND") notFound();
    throw err;
  }

  const { campaign, creatives } = detail;
  // Same rule the API enforces: only an unpaid draft or rejected campaign can
  // change. Anything else goes back to its page rather than to a form that
  // would fail on save.
  const editable =
    (campaign.status === "draft" || campaign.status === "rejected") &&
    campaign.paymentStatus === "unpaid";
  if (!editable) redirect(`/advertise/campaigns/${id}`);

  const creative = creatives[0];

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-dark-100">
      <div className="mx-auto max-w-5xl">
        <CampaignBuilder
          defaultEmail={session.user.email ?? ""}
          existing={{
            id: campaign._id,
            name: campaign.name,
            company: campaign.company,
            website: campaign.website,
            contactEmail: campaign.contactEmail,
            placement: campaign.placement,
            days: campaign.days,
            // Stored as UTC midnight, so the date part is the booked day.
            startDate: new Date(campaign.startDate).toISOString().slice(0, 10),
            headline: creative?.headline ?? "",
            body: creative?.body ?? "",
            imageUrl: creative?.imageUrl ?? "",
            destinationUrl: creative?.destinationUrl ?? "",
            ctaLabel: creative?.ctaLabel ?? "",
            reviewNote:
              campaign.status === "rejected" ? campaign.reviewNote : undefined,
          }}
        />
      </div>
    </div>
  );
}
