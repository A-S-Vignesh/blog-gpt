import Link from "next/link";
import {
  FaUsers,
  FaFileAlt,
  FaComments,
  FaEnvelope,
  FaFlag,
  FaHourglassHalf,
  FaBan,
  FaUserSlash,
  FaCreditCard,
  FaPenNib,
  FaShieldAlt,
  FaBullhorn,
  FaDollarSign,
} from "react-icons/fa";
import { redirect } from "next/navigation";
import { getAdminStats } from "@/lib/data/admin";
import { getAdRevenueOverview } from "@/lib/data/adminAds";
import { formatCents } from "@/config/ads";
import { getAdminActor } from "@/lib/admin/guard";
import StatCard from "@/components/admin/StatCard";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  // Not the security boundary — getAdminStats() enforces that itself. This is
  // here so a non-admin gets a /403 redirect instead of an error boundary.
  if (!(await getAdminActor())) redirect("/403");

  const [stats, ads] = await Promise.all([
    getAdminStats(),
    getAdRevenueOverview(),
  ]);

  const needsReview =
    stats.posts.flagged + stats.messages.unread + ads.totals.pendingReview;

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
          <FaShieldAlt className="text-blue-600" />
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {needsReview > 0
            ? `${needsReview} item${needsReview === 1 ? "" : "s"} waiting on you.`
            : "Nothing needs your attention right now."}
        </p>
      </header>

      {/* Queues first — these are the numbers an admin opens the panel to act
          on. Totals are context and sit below. */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Needs attention
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Flagged posts"
            value={stats.posts.flagged}
            icon={FaFlag}
            href="/admin/posts?moderationStatus=flagged"
            hint="Caught by AI moderation"
            alert
          />
          <StatCard
            label="Awaiting moderation"
            value={stats.posts.pendingModeration}
            icon={FaHourglassHalf}
            href="/admin/posts?moderationStatus=pending"
            hint="Never classified"
          />
          <StatCard
            label="Unread messages"
            value={stats.messages.unread}
            icon={FaEnvelope}
            href="/admin/messages?status=new"
            hint={`${stats.messages.total} total`}
            alert
          />
          <StatCard
            label="Ad campaigns to review"
            value={ads.totals.pendingReview}
            icon={FaBullhorn}
            href="/admin/ads?status=pending_review"
            hint="Advertisers waiting on you"
            alert
          />
        </div>
      </section>

      {/* Ad revenue gets its own row: it is the one section that is money we
          earned rather than a queue or a count. */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Advertising
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Ad revenue"
            value={ads.totals.revenueCents}
            display={formatCents(ads.totals.revenueCents)}
            icon={FaDollarSign}
            href="/admin/ads"
            hint="All time, delivered"
          />
          <StatCard
            label="This month"
            value={ads.totals.revenueThisMonthCents}
            display={formatCents(ads.totals.revenueThisMonthCents)}
            icon={FaDollarSign}
            hint="Ad revenue so far"
          />
          <StatCard
            label="Live campaigns"
            value={ads.totals.liveCampaigns}
            icon={FaBullhorn}
            href="/admin/ads?status=active"
            hint={`${ads.totals.advertisers} advertiser${ads.totals.advertisers === 1 ? "" : "s"}`}
          />
          <StatCard
            label="Awaiting payment"
            value={ads.totals.awaitingPaymentCents}
            display={formatCents(ads.totals.awaitingPaymentCents)}
            icon={FaHourglassHalf}
            hint={`${ads.totals.bookedDaysRunning} days of inventory sold`}
          />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Accounts
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Pending deletions"
            value={stats.users.pendingDeletion}
            icon={FaUserSlash}
            href="/admin/users?state=deleting"
            hint="GDPR requests in grace period"
          />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Content
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Posts"
            value={stats.posts.total}
            icon={FaFileAlt}
            href="/admin/posts"
            hint={`+${stats.posts.newThisWeek} this week`}
          />
          <StatCard
            label="Published"
            value={stats.posts.published}
            icon={FaPenNib}
            href="/admin/posts?status=published"
          />
          <StatCard
            label="Drafts"
            value={stats.posts.drafts}
            icon={FaFileAlt}
            href="/admin/posts?status=draft"
          />
          <StatCard
            label="Comments"
            value={stats.comments.total}
            icon={FaComments}
            href="/admin/comments"
            hint={`+${stats.comments.newThisWeek} this week`}
          />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          People &amp; revenue
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Users"
            value={stats.users.total}
            icon={FaUsers}
            href="/admin/users"
            hint={`+${stats.users.newThisWeek} this week`}
          />
          <StatCard
            label="Banned"
            value={stats.users.banned}
            icon={FaBan}
            href="/admin/users?state=banned"
            hint={`${stats.users.admins} admin${stats.users.admins === 1 ? "" : "s"}`}
          />
          <StatCard
            label="Active subscriptions"
            value={stats.subscriptions.active}
            icon={FaCreditCard}
            hint={`${stats.subscriptions.pro} pro · ${stats.subscriptions.business} business`}
          />
          <StatCard
            label="Paid conversion"
            value={
              stats.users.total > 0
                ? Math.round(
                    (stats.subscriptions.active / stats.users.total) * 100,
                  )
                : 0
            }
            icon={FaCreditCard}
            hint="% of users on a paid plan"
          />
        </div>
      </section>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Every action you take in this panel is written to the{" "}
        <Link href="/admin/audit" className="text-blue-600 hover:underline">
          audit log
        </Link>{" "}
        with your email, the before/after values, and your IP.
      </p>
    </div>
  );
}
