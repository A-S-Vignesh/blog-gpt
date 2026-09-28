import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import CampaignBuilder from "@/components/ads/CampaignBuilder";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New campaign | The Blog GPT",
  robots: { index: false, follow: false },
};

export default async function NewCampaignPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?._id) {
    redirect("/auth/signin?callbackUrl=%2Fadvertise%2Fnew");
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-dark-100">
      <div className="mx-auto max-w-5xl">
        <CampaignBuilder defaultEmail={session.user.email ?? ""} />
      </div>
    </div>
  );
}
