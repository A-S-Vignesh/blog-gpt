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

function ctr(clicks: number, impressions: number): string {
  if (impressions === 0) return "—";
  return `${((clicks / impressions) * 100).toFixed(2)}%`;
}

/** Booked days are UTC days — see fmtDay in the campaign builder. */
function fmtDay(value: string | number): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function AdvertiserDashboard({
  overview,
  initialCampaigns,
}: {
  overview: AdvertiserOverview;
  initialCampaigns: { campaigns: CampaignRow[]; total: number; hasMore: boolean };
}) {
  const [campaigns] = useState(initialCampaigns.campaigns);
  const { totals, daily } = overview;

  const labels = daily.map((d) => d.date.slice(5));

  return (
    <>
      {/* ── HEADLINE NUMBERS ─────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Impressions"
          value={totals.impressions.toLocaleString()}
          icon={FaEye}
          hint="All time"
        />
        <StatTile
          label="Clicks"
          value={totals.clicks.toLocaleString()}
          icon={FaMousePointer}
          hint={`${ctr(totals.clicks, totals.impressions)} click-through rate`}
        />
        <StatTile
          label="Paid"
          value={formatCents(totals.paidCents)}
          icon={FaDollarSign}
          hint={
            totals.dueCents > 0
              ? `${formatCents(totals.dueCents)} awaiting payment`
              : "All settled"
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
          labels={labels}
          series={[
            {
              key: "impr",
              label: "Impressions",
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
            <span className="font-normal text-gray-500 dark:text-gray-400">
              ({initialCampaigns.total})
            </span>
          </h2>
        </div>

        {campaigns.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <FaBullhorn className="mx-auto mb-3 text-3xl text-gray-300 dark:text-gray-600" />
            <p className="font-medium text-gray-900 dark:text-white">
              No campaigns yet
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Build your first one — it takes about three minutes.
            </p>
            <Link
              href="/advertise/new"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Create a campaign <FaArrowRight />
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {campaigns.map((c) => {
              // Progress through the booked run, not through a budget.
              const elapsed = daysElapsed(c.startDate, c.days);
              const pct =
                c.days > 0 ? Math.min(100, (elapsed / c.days) * 100) : 0;
              const running = c.status === "active";
              const left = daysRemaining(c.endDate);

              return (
                <li key={c._id}>
                  <Link
                    href={`/advertise/campaigns/${c._id}`}
                    className="block px-5 py-4 transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <CampaignStatusBadge
                            status={c.status}
                            paymentStatus={c.paymentStatus}
                          />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {AD_PLACEMENTS[c.placement]?.name ?? c.placement} ·{" "}
                            {c.days} days · {formatCents(c.priceCents)}
                          </span>
                        </div>
                        <h3 className="truncate font-semibold text-gray-900 dark:text-white">
                          {c.name}
                        </h3>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          {fmtDay(c.startDate)} –{" "}
                          {fmtDay(new Date(c.endDate).getTime() - 86_400_000)} ·{" "}
                          {c.impressions.toLocaleString()} impressions ·{" "}
                          {c.clicks.toLocaleString()} clicks ·{" "}
                          {ctr(c.clicks, c.impressions)} CTR
                        </p>

                        {c.status === "rejected" && c.reviewNote && (
                          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
                            {c.reviewNote}
                          </p>
                        )}
                      </div>

                      <div className="w-full shrink-0 sm:w-48">
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="text-gray-500 dark:text-gray-400">
                            {running
                              ? `Day ${Math.min(elapsed + 1, c.days)} of ${c.days}`
                              : `${c.days} days`}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {running ? `${left} left` : c.status === "completed" ? "Done" : "—"}
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                          <div
                            className="h-full rounded-full bg-blue-600 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
