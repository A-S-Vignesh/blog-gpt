"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
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
  FaPen,
  FaTrash,
  FaLock,
  FaExclamationTriangle,
} from "react-icons/fa";
import { useToast } from "@/provider/ToastProvider";
import StatTile from "@/components/ads/StatTile";
import TrendChart from "@/components/ads/TrendChart";
import CampaignStatusBadge from "@/components/ads/CampaignStatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  AD_PLACEMENTS,
  daysElapsed,
  daysRemaining,
  formatCents,
} from "@/config/ads";
import type { CampaignDetail } from "@/lib/data/ads";

const SUPPORT_EMAIL = "support@thebloggpt.com";

/** Booked days are UTC days; see fmtDay in the campaign builder. */
function fmtDay(value: string | Date | number): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** "2026-09-30" -> "Sep 30", for chart labels. */
function fmtChartDay(isoDay: string): string {
  return new Date(`${isoDay}T00:00:00Z`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
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
      reject(new Error("Couldn't load the payment window. Check your connection and try again."));
    };
    document.body.appendChild(script);
  });
  return scriptPromise;
}

type Tone = "info" | "warning" | "danger" | "success" | "neutral";

const TONE: Record<Tone, { box: string; title: string; body: string }> = {
  info: {
    box: "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30",
    title: "text-blue-900 dark:text-blue-200",
    body: "text-blue-800 dark:text-blue-300",
  },
  warning: {
    box: "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30",
    title: "text-amber-900 dark:text-amber-200",
    body: "text-amber-800 dark:text-amber-300",
  },
  danger: {
    box: "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30",
    title: "text-red-900 dark:text-red-200",
    body: "text-red-800 dark:text-red-300",
  },
  success: {
    box: "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30",
    title: "text-emerald-900 dark:text-emerald-200",
    body: "text-emerald-800 dark:text-emerald-300",
  },
  neutral: {
    box: "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900",
    title: "text-gray-900 dark:text-white",
    body: "text-gray-700 dark:text-gray-300",
  },
};

function Banner({
  tone,
  title,
  children,
  action,
}: {
  tone: Tone;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  const t = TONE[tone];
  return (
    <div className={`mb-6 rounded-xl border p-4 ${t.box}`}>
      <p className={`font-semibold ${t.title}`}>{title}</p>
      {children && (
        <div className={`mt-1 space-y-1.5 text-sm ${t.body}`}>{children}</div>
      )}
      {action && <div className="mt-3 flex flex-wrap gap-2">{action}</div>}
    </div>
  );
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
  const [confirming, setConfirming] = useState<"pause" | "delete" | null>(null);
  // A payment Razorpay took but we couldn't verify. Kept on screen (not a
  // toast) because the advertiser needs the payment ID to get help.
  const [payIssue, setPayIssue] = useState<{
    paymentId: string;
    message: string;
  } | null>(null);
  const verifyingRef = useRef(false);
  const { campaign, creatives, daily } = detail;

  const status = campaign.status;
  const paid = campaign.paymentStatus === "paid";
  const unpaid = campaign.paymentStatus === "unpaid";
  const lastDay = new Date(campaign.endDate).getTime() - 86_400_000;

  const ctr =
    campaign.impressions > 0
      ? `${((campaign.clicks / campaign.impressions) * 100).toFixed(2)}%`
      : "Not yet";
  // Progress is measured in DAYS, not dollars, and only for a run that has
  // actually been paid for and started. A draft or unpaid booking whose start
  // date has passed hasn't delivered a single day.
  const isRunning = status === "active";
  const showProgress =
    paid && (status === "active" || status === "paused" || status === "completed");
  const elapsed = daysElapsed(campaign.startDate, campaign.days);
  const left = daysRemaining(campaign.endDate);
  const pct =
    showProgress && campaign.days > 0
      ? Math.min(100, (elapsed / campaign.days) * 100)
      : 0;

  const canEdit = (status === "draft" || status === "rejected") && unpaid;
  const canSubmit = status === "draft" || status === "rejected";
  const canDelete = canEdit && campaign.impressions === 0;
  const needsPayment = status === "approved" && unpaid;
  // Pausing an unpaid booking would only hide the Pay button.
  const canPause = (status === "active" || status === "approved") && paid;
  const canResume = status === "paused";

  async function act(action: string, successMessage: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/ads/campaigns/${campaign._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "That didn't work. Please try again.");
      showToast(successMessage, "success");
      router.refresh();
    } catch (err: any) {
      showToast(err?.message || "That didn't work. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      const res = await fetch(`/api/ads/campaigns/${campaign._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Couldn't delete the campaign.");
      showToast("Campaign deleted.", "success");
      router.push("/advertise/dashboard");
      router.refresh();
    } catch (err: any) {
      showToast(err?.message || "Couldn't delete the campaign.", "error");
      setBusy(false);
    }
  }

  /**
   * Booking checkout. The amount and order both come from the server; the
   * browser only relays what Razorpay hands back, and the verify endpoint
   * re-checks the signature before anything is marked paid.
   *
   * The Pay button stays disabled from the first click until checkout is
   * closed or the payment is verified, so it can't be pressed twice while a
   * charge is in flight.
   */
  async function pay() {
    if (busy) return;
    setBusy(true);
    setPayIssue(null);
    verifyingRef.current = false;
    let opened = false;
    try {
      await loadRazorpay();
      const res = await fetch(`/api/ads/campaigns/${campaign._id}/pay`, {
        method: "POST",
      });
      const order = await res.json();
      if (!res.ok) throw new Error(order?.error || "Couldn't start checkout.");

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "The Blog GPT",
        description: `${order.days} days: ${order.campaignName}`,
        prefill: {
          email: campaign.contactEmail || undefined,
          name: campaign.company || undefined,
        },
        handler: async (response: any) => {
          verifyingRef.current = true;
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
              throw new Error(result?.error || "We couldn't confirm the payment.");
            }
            showToast("Payment received. Your campaign is scheduled.", "success");
            router.refresh();
          } catch (err: any) {
            setPayIssue({
              paymentId: response?.razorpay_payment_id ?? "",
              message: err?.message || "We couldn't confirm the payment.",
            });
          } finally {
            verifyingRef.current = false;
            setBusy(false);
          }
        },
        modal: {
          ondismiss: () => {
            if (!verifyingRef.current) setBusy(false);
          },
        },
        theme: { color: "#2563eb" },
      });
      rzp.on?.("payment.failed", (resp: any) => {
        const reason = resp?.error?.description;
        showToast(
          reason
            ? `Payment didn't go through: ${reason} You can try again.`
            : "Payment didn't go through. You can try again or use another card.",
          "error",
        );
      });
      rzp.open();
      opened = true;
    } catch (err: any) {
      showToast(err?.message || "Checkout failed. Please try again.", "error");
    } finally {
      if (!opened) setBusy(false);
    }
  }

  const btn =
    "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";
  const btnPrimary = `${btn} bg-blue-600 text-white hover:bg-blue-700`;
  const btnPay = `${btn} bg-emerald-700 text-white hover:bg-emerald-800`;
  const btnOutline = `${btn} border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800`;

  const editLink = canEdit && (
    <Link href={`/advertise/campaigns/${campaign._id}/edit`} className={btnOutline}>
      <FaPen /> Edit campaign
    </Link>
  );

  const paymentLabel = paid
    ? `${formatCents(campaign.priceCents)} paid`
    : campaign.paymentStatus === "refunded"
      ? `${formatCents(campaign.priceCents)} · refunded`
      : `${formatCents(campaign.priceCents)} · not paid yet`;

  return (
    <>
      <div className="mb-6">
        <Link
          href="/advertise/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <FaArrowLeft /> Back to campaigns
        </Link>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-1.5">
              <CampaignStatusBadge
                status={status}
                paymentStatus={campaign.paymentStatus}
              />
            </div>
            <h1 className="wrap-break-word text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
              {campaign.name}
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {AD_PLACEMENTS[campaign.placement]?.name} · {campaign.days} days ·{" "}
              {fmtDay(campaign.startDate)} to {fmtDay(lastDay)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {canSubmit && (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  act("submit", "Submitted. We'll email you within 24 hours.")
                }
                className={btnPrimary}
              >
                <FaPaperPlane /> Submit for review
              </button>
            )}
            {editLink}
            {needsPayment && paymentsEnabled && (
              <button
                type="button"
                disabled={busy}
                onClick={pay}
                className={btnPay}
              >
                <FaCreditCard />{" "}
                {busy ? "Processing…" : `Pay ${formatCents(campaign.priceCents)}`}
              </button>
            )}
            {canPause && (
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirming("pause")}
                className={btnOutline}
              >
                <FaPause /> Pause
              </button>
            )}
            {canResume && (
              <button
                type="button"
                disabled={busy}
                onClick={() => act("resume", "Campaign resumed.")}
                className={btnPay}
              >
                <FaPlay /> Resume
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── PAYMENT PROBLEM ──────────────────────────────────────────── */}
      {payIssue && (
        <div
          role="alert"
          className="mb-6 flex gap-3 rounded-xl border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/40"
        >
          <FaExclamationTriangle className="mt-0.5 shrink-0 text-red-600 dark:text-red-400" />
          <div className="text-sm text-red-800 dark:text-red-300">
            <p className="font-semibold text-red-900 dark:text-red-200">
              We couldn&apos;t confirm your payment yet
            </p>
            <p className="mt-1">
              Please don&apos;t pay again. Email{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Ad payment ${payIssue.paymentId}`)}`}
                className="font-semibold underline"
              >
                {SUPPORT_EMAIL}
              </a>{" "}
              with the payment ID below and we&apos;ll set your campaign live.
            </p>
            {payIssue.paymentId && (
              <p className="mt-2 font-mono text-xs">
                Payment ID: <span className="select-all">{payIssue.paymentId}</span>
              </p>
            )}
            <p className="mt-1 text-xs opacity-80">Details: {payIssue.message}</p>
          </div>
        </div>
      )}

      {/* ── STATUS BANNERS: what this state means and what to do next ── */}
      {status === "draft" && (
        <Banner tone="info" title="Draft: not submitted yet">
          <p>
            Check your ad, then submit it for review. Submitting is free, and
            you only pay after it&apos;s approved.
          </p>
        </Banner>
      )}

      {status === "pending_review" && (
        <Banner tone="warning" title="In review">
          <p>
            A person is checking your ad, usually within 24 hours. We&apos;ll
            email {campaign.contactEmail || "you"} with the decision.
          </p>
        </Banner>
      )}

      {status === "rejected" && (
        <Banner tone="danger" title="This campaign needs changes">
          {campaign.reviewNote ? (
            <p>
              <strong>Reviewer&apos;s note:</strong> {campaign.reviewNote}
            </p>
          ) : (
            <p>
              Our reviewer asked for changes. Check your email for details, or{" "}
              <Link href="/contact" className="font-semibold underline">
                contact us
              </Link>
              .
            </p>
          )}
          <p>
            You haven&apos;t been charged.{" "}
            {canEdit
              ? "Edit the campaign, then submit it again."
              : "Contact us and we'll help you fix it."}
          </p>
        </Banner>
      )}

      {needsPayment && (
        <Banner
          tone="warning"
          title="Approved: one step to go"
          action={
            paymentsEnabled && (
              <p className="inline-flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-300">
                <FaLock /> Secure card payment by Razorpay, charged in USD.
              </p>
            )
          }
        >
          {paymentsEnabled ? (
            <>
              <p>
                Pay {formatCents(campaign.priceCents)} for your {campaign.days}{" "}
                days and your ad starts on {fmtDay(campaign.startDate)}. If that
                date has passed when you pay, your dates move so you still get
                all {campaign.days} days.
              </p>
              <p className="font-semibold">
                Pay before the end of {fmtDay(lastDay)} (UTC), or this booking
                lapses and the spot is released.
              </p>
            </>
          ) : (
            <p>
              We&apos;ll invoice you directly. Reply to your approval email and
              we&apos;ll set it live.
            </p>
          )}
        </Banner>
      )}

      {status === "approved" && paid && (
        <Banner tone="info" title="Paid and scheduled">
          <p>
            Your ad starts on {fmtDay(campaign.startDate)} and runs until{" "}
            {fmtDay(lastDay)}. There&apos;s nothing else you need to do.
          </p>
        </Banner>
      )}

      {status === "paused" && (
        <Banner tone="warning" title="Paused: your ad isn't showing">
          <p>
            Your booked dates keep running while it&apos;s paused, so paused
            days aren&apos;t added back. Resume to keep showing your ad until{" "}
            {fmtDay(lastDay)}.
          </p>
        </Banner>
      )}

      {status === "completed" && (
        <Banner
          tone="neutral"
          title={paid ? `Finished on ${fmtDay(lastDay)}` : "This booking lapsed"}
          action={
            <Link href="/advertise/new" className={btnPrimary}>
              Book again
            </Link>
          }
        >
          <p>
            {paid
              ? "Thanks for advertising with us. Your numbers below are final."
              : "It wasn't paid before its dates ended, so it never ran and you weren't charged."}
          </p>
        </Banner>
      )}

      {/* ── NUMBERS ──────────────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Views"
          value={campaign.impressions.toLocaleString()}
          icon={FaEye}
        />
        <StatTile
          label="Clicks"
          value={campaign.clicks.toLocaleString()}
          icon={FaMousePointer}
        />
        <StatTile label="Click rate" value={ctr} icon={FaPercent} />
        <StatTile
          label={isRunning ? "Days left" : "Booked"}
          value={isRunning ? String(left) : `${campaign.days} days`}
          icon={FaRegCalendarAlt}
          hint={paymentLabel}
          accent={isRunning ? "positive" : "default"}
        />
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Delivery
          </h2>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {showProgress
              ? `Day ${Math.min(elapsed + (isRunning ? 1 : 0), campaign.days)} of ${campaign.days}`
              : `Starts ${fmtDay(campaign.startDate)} once paid`}
          </span>
        </div>

        {/* Time, not money. This bar is the honest picture of a flat booking:
            what fraction of the run has happened. */}
        <div className="mb-5">
          <div
            className="h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
            role="progressbar"
            aria-label="Booked days delivered"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pct)}
          >
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] text-gray-600 dark:text-gray-400">
            <span>{fmtDay(campaign.startDate)}</span>
            <span>{fmtDay(lastDay)}</span>
          </div>
        </div>

        <TrendChart
          labels={daily.map((d) => fmtChartDay(d.date))}
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

      {/* ── THE AD ITSELF ────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {creatives.length === 1 ? "Your ad" : `Your ads (${creatives.length})`}
          </h2>
          {canEdit && (
            <Link
              href={`/advertise/campaigns/${campaign._id}/edit`}
              className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
              Edit
            </Link>
          )}
        </div>
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {creatives.map((c) => (
            <li key={c._id} className="flex flex-col gap-4 p-5 sm:flex-row">
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
                  className="mt-1 inline-flex max-w-full items-center gap-1.5 break-all text-xs text-blue-600 hover:underline dark:text-blue-400"
                >
                  {c.destinationUrl}{" "}
                  <FaExternalLinkAlt className="shrink-0 text-[9px]" />
                </a>
              </div>
              <div className="shrink-0 text-xs text-gray-600 sm:text-right dark:text-gray-400">
                <p>{c.impressions.toLocaleString()} views</p>
                <p>{c.clicks.toLocaleString()} clicks</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {canDelete && (
        <div className="mt-6 text-right">
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirming("delete")}
            className="inline-flex items-center gap-2 text-sm font-medium text-red-700 hover:underline disabled:opacity-50 dark:text-red-400"
          >
            <FaTrash className="text-xs" /> Delete this campaign
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirming === "pause"}
        title="Pause this campaign?"
        description={`Your ad stops showing right away. Your booked dates keep running while it's paused, so paused days aren't added back. You can resume any time before ${fmtDay(lastDay)}.`}
        confirmLabel="Pause campaign"
        cancelLabel="Keep it running"
        loading={busy}
        onConfirm={async () => {
          await act("pause", "Campaign paused.");
          setConfirming(null);
        }}
        onCancel={() => setConfirming(null)}
      />
      <ConfirmDialog
        open={confirming === "delete"}
        title="Delete this campaign?"
        description="This removes the campaign and its ad. It can't be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={busy}
        onConfirm={remove}
        onCancel={() => setConfirming(null)}
      />
    </>
  );
}
