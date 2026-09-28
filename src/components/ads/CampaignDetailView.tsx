"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  FaArrowLeft,
  FaEye,
  FaMousePointer,
  FaRegCalendarAlt,
  FaPercent,
  FaPause,
  FaPlay,
  FaCreditCard,
  FaExternalLinkAlt,
  FaPaperPlane,
} from "react-icons/fa";
import { useToast } from "@/provider/ToastProvider";
import StatTile from "@/components/ads/StatTile";
import TrendChart from "@/components/ads/TrendChart";
import CampaignStatusBadge from "@/components/ads/CampaignStatusBadge";
import {
  AD_PLACEMENTS,
  daysElapsed,
  daysRemaining,
  formatCents,
} from "@/config/ads";
import type { CampaignDetail } from "@/lib/data/ads";

/** Booked days are UTC days — see fmtDay in the campaign builder. */
function fmtDay(value: string | Date | number): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

declare global {
  interface Window {
    Razorpay?: any;
  }
}

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

let scriptPromise: Promise<void> | null = null;
function loadRazorpay(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Failed to load Razorpay Checkout"));
    };
    document.body.appendChild(script);
  });
  return scriptPromise;
}

export default function CampaignDetailView({
  detail,
  paymentsEnabled,
}: {
  detail: CampaignDetail;
  paymentsEnabled: boolean;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);
  const { campaign, creatives, daily } = detail;

  const ctr =
    campaign.impressions > 0
      ? `${((campaign.clicks / campaign.impressions) * 100).toFixed(2)}%`
      : "—";
  // Progress is measured in DAYS, not dollars. A flat booking has no spend
  // curve to plot — what an advertiser wants to know is how much of the run
  // they have had and how much is still coming.
  const isRunning = campaign.status === "active";
  const elapsed = daysElapsed(campaign.startDate, campaign.days);
  const left = daysRemaining(campaign.endDate);
  const pct = campaign.days > 0 ? Math.min(100, (elapsed / campaign.days) * 100) : 0;

  async function act(action: string, successMessage: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/ads/campaigns/${campaign._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Action failed.");
      showToast(successMessage, "success");
      router.refresh();
    } catch (err: any) {
      showToast(err?.message || "Action failed.", "error");
    } finally {
      setBusy(false);
    }
  }

  /**
   * Booking checkout. The amount and order both come from the server — the
   * browser only relays what Razorpay hands back, and the verify endpoint
   * re-checks the signature before anything is marked paid.
   */
  async function pay() {
    setBusy(true);
    try {
      await loadRazorpay();
      const res = await fetch(`/api/ads/campaigns/${campaign._id}/pay`, {
        method: "POST",
      });
      const order = await res.json();
      if (!res.ok) throw new Error(order?.error || "Could not start checkout.");

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "The Blog GPT",
        description: `${order.days} days — ${order.campaignName}`,
        handler: async (response: any) => {
          try {
            const verify = await fetch(
              `/api/ads/campaigns/${campaign._id}/pay/verify`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(response),
              },
            );
            const result = await verify.json();
            if (!verify.ok) {
              throw new Error(result?.error || "Payment could not be verified.");
            }
            showToast("Payment received — your campaign is scheduled.", "success");
            router.refresh();
          } catch (err: any) {
            showToast(err?.message || "Payment verification failed.", "error");
          }
        },
        modal: { ondismiss: () => setBusy(false) },
        theme: { color: "#2563eb" },
      });
      rzp.open();
    } catch (err: any) {
      showToast(err?.message || "Checkout failed.", "error");
    } finally {
      setBusy(false);
    }
  }

  const canSubmit =
    campaign.status === "draft" || campaign.status === "rejected";
  const needsPayment =
    campaign.status === "approved" && campaign.paymentStatus === "unpaid";
  const canPause =
    campaign.status === "active" || campaign.status === "approved";
  const canResume = campaign.status === "paused";

  return (
    <>
      <div className="mb-6">
        <Link
          href="/advertise/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <FaArrowLeft /> Back to campaigns
        </Link>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-1.5">
              <CampaignStatusBadge
                status={campaign.status}
                paymentStatus={campaign.paymentStatus}
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
              {campaign.name}
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {AD_PLACEMENTS[campaign.placement]?.name} · {campaign.days} days ·{" "}
              {fmtDay(campaign.startDate)} –{" "}
              {fmtDay(new Date(campaign.endDate).getTime() - 86_400_000)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {canSubmit && (
              <button
                disabled={busy}
                onClick={() =>
                  act("submit", "Submitted. We'll email you within 24 hours.")
                }
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                <FaPaperPlane /> Submit for review
              </button>
            )}
            {needsPayment && paymentsEnabled && (
              <button
                disabled={busy}
                onClick={pay}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                <FaCreditCard /> Pay {formatCents(campaign.priceCents)}
              </button>
            )}
            {canPause && (
              <button
                disabled={busy}
                onClick={() => act("pause", "Campaign paused.")}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <FaPause /> Pause
              </button>
            )}
            {canResume && (
              <button
                disabled={busy}
                onClick={() => act("resume", "Campaign resumed.")}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                <FaPlay /> Resume
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── STATUS BANNERS ───────────────────────────────────────────── */}
      {campaign.status === "rejected" && campaign.reviewNote && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
          <p className="font-semibold text-red-800 dark:text-red-300">
            This campaign needs changes
          </p>
          <p className="mt-1 text-sm text-red-700 dark:text-red-400">
            {campaign.reviewNote}
          </p>
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">
            You haven&apos;t been charged. Fix the issue and submit again.
          </p>
        </div>
      )}

      {needsPayment && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
          <p className="font-semibold text-amber-800 dark:text-amber-300">
            Approved — one step to go
          </p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
            {paymentsEnabled
              ? `Pay ${formatCents(campaign.priceCents)} for your ${campaign.days} days and delivery starts on ${fmtDay(campaign.startDate)}. If that date has already passed by the time you pay, we move the start to that day so you keep the full ${campaign.days} days.`
              : "We'll invoice you directly — reply to your approval email and we'll set it live."}
          </p>
        </div>
      )}

      {/* ── NUMBERS ──────────────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Impressions"
          value={campaign.impressions.toLocaleString()}
          icon={FaEye}
        />
        <StatTile
          label="Clicks"
          value={campaign.clicks.toLocaleString()}
          icon={FaMousePointer}
        />
        <StatTile label="CTR" value={ctr} icon={FaPercent} />
        <StatTile
          label={isRunning ? "Days left" : "Booked"}
          value={isRunning ? String(left) : `${campaign.days} days`}
          icon={FaRegCalendarAlt}
          hint={
            campaign.paymentStatus === "paid"
              ? `${formatCents(campaign.priceCents)} paid`
              : `${formatCents(campaign.priceCents)} · ${campaign.paymentStatus}`
          }
          accent={isRunning ? "positive" : "default"}
        />
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Delivery
          </h2>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Day {Math.min(elapsed + (isRunning ? 1 : 0), campaign.days)} of{" "}
            {campaign.days}
          </span>
        </div>

        {/* Time, not money. This bar is the honest picture of a flat booking:
            what fraction of the run has happened. */}
        <div className="mb-5">
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] text-gray-500 dark:text-gray-400">
            <span>{fmtDay(campaign.startDate)}</span>
            <span>
              {fmtDay(new Date(campaign.endDate).getTime() - 86_400_000)}
            </span>
          </div>
        </div>

        <TrendChart
          labels={daily.map((d) => d.date.slice(5))}
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

      {/* ── CREATIVES ────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Creatives ({creatives.length})
          </h2>
        </div>
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {creatives.map((c) => (
            <li key={c._id} className="flex gap-4 p-5">
              {c.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.imageUrl}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-lg object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {c.headline}
                </h3>
                {c.body && (
                  <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
                    {c.body}
                  </p>
                )}
                <a
                  href={c.destinationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
                >
                  {c.destinationUrl} <FaExternalLinkAlt className="text-[9px]" />
                </a>
              </div>
              <div className="shrink-0 text-right text-xs text-gray-500 dark:text-gray-400">
                <p>{c.impressions.toLocaleString()} views</p>
                <p>{c.clicks.toLocaleString()} clicks</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
