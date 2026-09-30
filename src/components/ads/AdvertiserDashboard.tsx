"use client";

import Link from "next/link";
import { useState } from "react";
import {
  FaEye,
  FaMousePointer,
  FaDollarSign,
  FaBullhorn,
  FaArrowRight,
} from "react-icons/fa";
import StatTile from "@/components/ads/StatTile";
import TrendChart from "@/components/ads/TrendChart";
import CampaignStatusBadge from "@/components/ads/CampaignStatusBadge";
import {
  AD_PLACEMENTS,
  daysElapsed,
  daysRemaining,
  formatCents,
} from "@/config/ads";
import type { AdvertiserOverview, CampaignRow } from "@/lib/data/ads";

const PAGE_SIZE = 20;

function clickRate(clicks: number, impressions: number): string | null {
  if (impressions === 0) return null;
  return `${((clicks / impressions) * 100).toFixed(2)}%`;
}

/** Booked days are UTC days; see fmtDay in the campaign builder. */
function fmtDay(value: string | number): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * The right-hand summary for one campaign row. Progress is only meaningful
 * for a run that has been paid for and started; every other state gets a
 * plain sentence about what is happening instead of an empty bar.
 */
function rowProgress(c: CampaignRow): {
  left: string;
  right: string;
  pct: number | null;
} {
  const paid = c.paymentStatus === "paid";
  if (paid && ["active", "paused", "completed"].includes(c.status)) {
    const elapsed = daysElapsed(c.startDate, c.days);
    const pct = c.days > 0 ? Math.min(100, (elapsed / c.days) * 100) : 0;
    if (c.status === "completed") {
      return { left: `${c.days} days`, right: "Finished", pct: 100 };
    }
    const running = c.status === "active";
    return {
      left: `Day ${Math.min(elapsed + (running ? 1 : 0), c.days)} of ${c.days}`,
      right: running ? `${daysRemaining(c.endDate)} left` : "Paused",
      pct,
    };
  }
  switch (c.status) {
    case "draft":
      return { left: "Not submitted yet", right: "Draft", pct: null };
    case "pending_review":
      return { left: "Reply within about 24h", right: "In review", pct: null };
    case "rejected":
      return { left: "Edit and resubmit", right: "Needs changes", pct: null };
    case "approved":
      return paid
        ? { left: `Starts ${fmtDay(c.startDate)}`, right: "Scheduled", pct: 0 }
        : { left: "Pay to go live", right: "Payment due", pct: null };
    case "completed":
      return { left: "Never paid", right: "Lapsed", pct: null };
    default:
      return { left: `${c.days} days`, right: "", pct: null };
  }
}

export default function AdvertiserDashboard({
  overview,
  initialCampaigns,
}: {
  overview: AdvertiserOverview;
  initialCampaigns: { campaigns: CampaignRow[]; total: number; hasMore: boolean };
}) {
  const [campaigns, setCampaigns] = useState(initialCampaigns.campaigns);
  const [hasMore, setHasMore] = useState(initialCampaigns.hasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const { totals, daily } = overview;

  async function loadMore() {
    setLoadingMore(true);
    setLoadError(false);
    try {
      const res = await fetch(
        `/api/ads/campaigns?skip=${campaigns.length}&limit=${PAGE_SIZE}`,
      );
      if (!res.ok) throw new Error();
      const page = await res.json();
      setCampaigns((prev) => [...prev, ...(page.campaigns ?? [])]);
      setHasMore(!!page.hasMore);
    } catch {
      setLoadError(true);
    } finally {
      setLoadingMore(false);
    }
  }

  // First visit: zero-value tiles and an empty chart above the only useful
  // button just look broken. Lead with the one thing to do.
  if (initialCampaigns.total === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center dark:border-gray-800 dark:bg-gray-900">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
          <FaBullhorn />
        </span>
        <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
          No campaigns yet
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-600 dark:text-gray-400">
          Build your first one in about three minutes. Submitting is free, and
          you only pay once a person has approved your ad.
        </p>
        <Link
          href="/advertise/new"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Create a campaign <FaArrowRight />
        </Link>
        <p className="mt-4 text-xs text-gray-600 dark:text-gray-400">
          Not sure yet?{" "}
          <Link
            href="/advertise#placements"
            className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            See placements and prices
          </Link>
        </p>
      </div>
    );
  }

  const overallRate = clickRate(totals.clicks, totals.impressions);

  return (
    <>
      {/* ── HEADLINE NUMBERS ─────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Views"
          value={totals.impressions.toLocaleString()}
          icon={FaEye}
          hint="All time"
        />
        <StatTile
          label="Clicks"
          value={totals.clicks.toLocaleString()}
          icon={FaMousePointer}
          hint={overallRate ? `${overallRate} click rate` : "No views yet"}
        />
        <StatTile
          label="Paid"
          value={formatCents(totals.paidCents)}
          icon={FaDollarSign}
          hint={
            totals.dueCents > 0
              ? `${formatCents(totals.dueCents)} waiting for payment`
              : "Nothing due"
          }
          accent={totals.dueCents > 0 ? "warning" : "default"}
        />
        <StatTile
          label="Live campaigns"
          value={String(totals.live)}
          icon={FaBullhorn}
          hint={
            totals.pendingReview > 0
              ? `${totals.pendingReview} in review`
              : `${totals.campaigns} total`
          }
          accent={totals.live > 0 ? "positive" : "default"}
        />
      </div>

      {/* ── TREND ────────────────────────────────────────────────────── */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">
          Last 30 days
        </h2>
        <TrendChart
          labels={daily.map((d) =>
            new Date(`${d.date}T00:00:00Z`).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              timeZone: "UTC",
            }),
          )}
          series={[
            {
              key: "impr",
              label: "Views",
              color: "#3b82f6",
              values: daily.map((d) => d.impressions),
            },
            {
              key: "clicks",
              label: "Clicks",
              color: "#10b981",
              values: daily.map((d) => d.clicks),
            },
          ]}
        />
      </div>

      {/* ── CAMPAIGNS ────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Campaigns{" "}
            <span className="font-normal text-gray-600 dark:text-gray-400">
              ({initialCampaigns.total})
            </span>
          </h2>
        </div>

        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {campaigns.map((c) => {
            const progress = rowProgress(c);
            const rate = clickRate(c.clicks, c.impressions);

            return (
              <li key={c._id}>
                <Link
                  href={`/advertise/campaigns/${c._id}`}
                  className="block px-5 py-4 transition hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none dark:hover:bg-gray-800/50 dark:focus-visible:bg-gray-800/50"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <CampaignStatusBadge
                          status={c.status}
                          paymentStatus={c.paymentStatus}
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {AD_PLACEMENTS[c.placement]?.name ?? c.placement} ·{" "}
                          {c.days} days · {formatCents(c.priceCents)}
                        </span>
                      </div>
                      <h3 className="truncate font-semibold text-gray-900 dark:text-white">
                        {c.name}
                      </h3>
                      <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
                        {fmtDay(c.startDate)} to{" "}
                        {fmtDay(new Date(c.endDate).getTime() - 86_400_000)} ·{" "}
                        {c.impressions.toLocaleString()} views ·{" "}
                        {c.clicks.toLocaleString()} clicks
                        {rate && ` · ${rate} click rate`}
                      </p>

                      {c.status === "rejected" && c.reviewNote && (
                        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800 dark:bg-red-950/40 dark:text-red-300">
                          <strong>Reviewer&apos;s note:</strong> {c.reviewNote}
                        </p>
                      )}
                    </div>

                    <div className="w-full shrink-0 sm:w-48">
                      <div className="mb-1 flex justify-between gap-2 text-xs">
                        <span className="text-gray-600 dark:text-gray-400">
                          {progress.left}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {progress.right}
                        </span>
                      </div>
                      {progress.pct !== null && (
                        <div className="h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                          <div
                            className="h-full rounded-full bg-blue-600 transition-all"
                            style={{ width: `${progress.pct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        {(hasMore || loadError) && (
          <div className="border-t border-gray-100 px-5 py-4 text-center dark:border-gray-800">
            {loadError && (
              <p className="mb-2 text-xs text-red-700 dark:text-red-400">
                Couldn&apos;t load more campaigns. Try again.
              </p>
            )}
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
