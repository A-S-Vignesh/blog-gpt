import { redirect } from "next/navigation";
import { FaBullhorn } from "react-icons/fa";
import { getAdminActor } from "@/lib/admin/guard";
import { getAdRevenueOverview, listAdminCampaigns } from "@/lib/data/adminAds";
import AdminAdsDashboard from "@/components/admin/AdminAdsDashboard";

export const dynamic = "force-dynamic";

const STATUSES = [
  "draft",
  "pending_review",
  "approved",
  "rejected",
  "active",
  "paused",
  "completed",
  "archived",
];

export default async function AdminAdsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  // Not the security boundary — the data functions enforce that themselves.
  // This is here so a non-admin gets /403 instead of an error boundary.
  if (!(await getAdminActor())) redirect("/403");

  const sp = await searchParams;
  const status =
    sp.status && STATUSES.includes(sp.status) ? sp.status : undefined;

  const [overview, campaigns] = await Promise.all([
    getAdRevenueOverview(),
    listAdminCampaigns({ status, limit: 20 }),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
          <FaBullhorn className="text-blue-600" />
          Advertising
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          What we&apos;ve earned, and every campaign waiting on a decision.
        </p>
      </header>

      <AdminAdsDashboard
        overview={overview}
        initialCampaigns={campaigns}
        status={status}
      />
    </div>
  );
}
