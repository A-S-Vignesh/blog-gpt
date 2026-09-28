"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  FaDollarSign,
  FaHourglassHalf,
  FaBullhorn,
  FaUsers,
  FaCheck,
  FaTimes,
  FaPause,
  FaPlay,
  FaMoneyCheckAlt,
  FaExternalLinkAlt,
  FaEye,
} from "react-icons/fa";
import { useToast } from "@/provider/ToastProvider";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import StatTile from "@/components/ads/StatTile";
import TrendChart from "@/components/ads/TrendChart";
import CampaignStatusBadge from "@/components/ads/CampaignStatusBadge";
import { AD_PLACEMENTS, formatCents } from "@/config/ads";
import type { AdRevenueOverview, AdminCampaignRow } from "@/lib/data/adminAds";

const TABS: { label: string; value: string }[] = [
  { label: "Needs review", value: "pending_review" },
  { label: "Live", value: "active" },
  { label: "Approved", value: "approved" },
  { label: "All", value: "" },
];

export default function AdminAdsDashboard({
  overview,
  initialCampaigns,
  status,
}: {
  overview: AdRevenueOverview;
  initialCampaigns: {
    campaigns: AdminCampaignRow[];
    total: number;
    hasMore: boolean;
  };
  status?: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [, startTransition] = useTransition();

  const [rows, setRows] = useState(initialCampaigns.campaigns);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<AdminCampaignRow | null>(null);
  const [reason, setReason] = useState("");

  const { totals, daily, topAdvertisers } = overview;

  async function act(
    campaign: AdminCampaignRow,
    action: string,
    body: Record<string, unknown>,
    message: string,
  ) {
    setBusyId(campaign._id);
    try {
      const res = await fetch(`/api/admin/ads/${campaign._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Action failed.");

      setRows((prev) =>
        prev.map((r) =>
          r._id === campaign._id
            ? {
                ...r,
                status: data.status ?? r.status,
                paymentStatus: data.paymentStatus ?? r.paymentStatus,
              }
            : r,
        ),
      );
      showToast(message, "success");
      router.refresh();
    } catch (err: any) {
      showToast(err?.message || "Action failed.", "error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      {/* ── REVENUE ──────────────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Revenue"
          value={formatCents(totals.revenueCents)}
          icon={FaDollarSign}
          hint="Delivered, all time"
          accent="positive"
        />
        <StatTile
          label="This month"
          value={formatCents(totals.revenueThisMonthCents)}
          icon={FaDollarSign}
          hint={
            totals.awaitingPaymentCents > 0
              ? `${formatCents(totals.awaitingPaymentCents)} approved, unpaid`
              : `${totals.bookedDaysRunning} days of inventory sold`
          }
        />
        <StatTile
          label="Needs review"
          value={String(totals.pendingReview)}
          icon={FaHourglassHalf}
          accent={totals.pendingReview > 0 ? "warning" : "default"}
          hint={`${totals.liveCampaigns} live now`}
        />
        <StatTile
          label="Advertisers"
          value={String(totals.advertisers)}
          icon={FaUsers}
          hint={`${totals.totalCampaigns} campaigns`}
        />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">
            Last 30 days
          </h2>
          <TrendChart
            labels={daily.map((d) => d.date.slice(5))}
            series={[
              {
                // Flat pricing books revenue on the day it is collected, so
                // this line is spiky by nature — one bar per sale, not a
                // smooth accrual curve. That is the shape of the business now.
                key: "rev",
                label: "Revenue",
                color: "#10b981",
                values: daily.map((d) => d.revenueCents),
                money: true,
              },
              {
                key: "impr",
                label: "Impressions",
                color: "#3b82f6",
                values: daily.map((d) => d.impressions),
              },
            ]}
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">
            Top advertisers
          </h2>
          {topAdvertisers.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No spend recorded yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {topAdvertisers.map((a, i) => (
                <li key={a.advertiserId} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {a.name}
                    </p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {a.campaigns} campaign{a.campaigns === 1 ? "" : "s"}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCents(a.paidCents)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── QUEUE ────────────────────────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const active = (status ?? "") === tab.value;
          return (
            <button
              key={tab.label}
              onClick={() => {
                const params = new URLSearchParams();
                if (tab.value) params.set("status", tab.value);
                startTransition(() =>
                  router.push(`/admin/ads?${params.toString()}`),
                );
              }}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                active
                  ? "bg-blue-600 text-white"
                  : "border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              {tab.label}
              {tab.value === "pending_review" && totals.pendingReview > 0 && (
                <span
                  className={`ml-1.5 rounded-full px-1.5 text-xs font-bold ${
                    active ? "bg-white text-blue-600" : "bg-red-500 text-white"
                  }`}
                >
                  {totals.pendingReview}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
          Nothing here.
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((c) => {
            const busy = busyId === c._id;
            return (
              <li
                key={c._id}
                className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <CampaignStatusBadge
                        status={c.status}
                        paymentStatus={c.paymentStatus}
                      />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {AD_PLACEMENTS[c.placement as keyof typeof AD_PLACEMENTS]
                          ?.name ?? c.placement}{" "}
                        · {c.days} days · {formatCents(c.priceCents)}
                        {c.discountPercent > 0 && ` (−${c.discountPercent}%)`}
                      </span>
                    </div>

                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {c.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {c.company && `${c.company} · `}
                      {c.advertiser
                        ? `${c.advertiser.name} (${c.advertiser.email})`
                        : "advertiser deleted"}{" "}
                      · {new Date(c.startDate).toLocaleDateString()} –{" "}
                      {new Date(c.endDate).toLocaleDateString()}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {c.impressions.toLocaleString()} impressions ·{" "}
                      {c.clicks.toLocaleString()} clicks ·{" "}
                      {c.paymentStatus === "paid"
                        ? `${formatCents(c.priceCents)} collected`
                        : `${formatCents(c.priceCents)} ${c.paymentStatus}`}
                    </p>

                    {/* Creatives — what the reviewer actually judges. */}
                    <div className="mt-3 space-y-2">
                      {c.creatives.map((cr) => (
                        <div
                          key={cr._id}
                          className="flex gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/60"
                        >
                          {cr.imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={cr.imageUrl}
                              alt=""
                              className="h-12 w-12 shrink-0 rounded object-cover"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {cr.headline}
                            </p>
                            {cr.body && (
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {cr.body}
                              </p>
                            )}
                            <a
                              href={cr.destinationUrl}
                              target="_blank"
                              rel="noopener noreferrer nofollow"
                              className="mt-0.5 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                            >
                              {cr.destinationUrl}{" "}
                              <FaExternalLinkAlt className="text-[9px]" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>

                    {c.reviewNote && (
                      <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                        <strong>Note:</strong> {c.reviewNote}
                      </p>
                    )}
                  </div>
                </div>

                {/* ── ACTIONS ──────────────────────────────────────── */}
                <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                  {c.status === "pending_review" && (
                    <>
                      <button
                        disabled={busy}
                        onClick={() =>
                          act(c, "approve", {}, "Approved — advertiser notified.")
                        }
                        className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                      >
                        <FaCheck /> Approve
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => {
                          setReason("");
                          setRejecting(c);
                        }}
                        className="flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950/40"
                      >
                        <FaTimes /> Reject
                      </button>
                    </>
                  )}

                  {(c.status === "active" || c.status === "approved") && (
                    <button
                      disabled={busy}
                      onClick={() => act(c, "pause", {}, "Campaign paused.")}
                      className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      <FaPause /> Pause
                    </button>
                  )}

                  {c.status === "paused" && (
                    <button
                      disabled={busy}
                      onClick={() => act(c, "resume", {}, "Campaign resumed.")}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <FaPlay /> Resume
                    </button>
                  )}

                  {c.paymentStatus === "unpaid" && c.status === "approved" && (
                    <button
                      disabled={busy}
                      onClick={() =>
                        act(
                          c,
                          "mark_paid",
                          {},
                          "Marked as paid — campaign will start delivering.",
                        )
                      }
                      className="flex items-center gap-1.5 rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50 dark:border-emerald-900 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                    >
                      <FaMoneyCheckAlt /> Mark paid (invoice)
                    </button>
                  )}

                  {c.advertiser && (
                    <Link
                      href={`/admin/users?q=${encodeURIComponent(c.advertiser.email)}`}
                      className="ml-auto flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline"
                    >
                      <FaEye /> Advertiser
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={rejecting !== null}
        title="Reject this campaign?"
        description={
          <>
            <strong>{rejecting?.name}</strong> will be sent back to the
            advertiser with your reason. They haven&apos;t been charged, so
            nothing needs refunding.
            <input
              autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="What needs to change? (required — they'll see this)"
              className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </>
        }
        confirmLabel="Reject and notify"
        variant="danger"
        loading={busyId !== null}
        onConfirm={async () => {
          if (!rejecting) return;
          if (!reason.trim()) {
            showToast("Give a reason — the advertiser needs it.", "error");
            return;
          }
          await act(
            rejecting,
            "reject",
            { reason: reason.trim() },
            "Rejected — advertiser notified.",
          );
          setRejecting(null);
        }}
        onCancel={() => setRejecting(null)}
      />
    </>
  );
}
