"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  FaArrowLeft,
  FaArrowRight,
  FaCheck,
  FaCheckCircle,
  FaExclamationTriangle,
  FaRegClock,
} from "react-icons/fa";
import { useToast } from "@/provider/ToastProvider";
import {
  AD_DURATIONS,
  AD_LIMITS,
  AD_PLACEMENTS,
  MAX_CAMPAIGN_DAYS,
  MIN_CAMPAIGN_DAYS,
  endDateFor,
  formatCents,
  formatCentsShort,
  quotePrice,
  utcMidnight,
  type AdPlacement,
} from "@/config/ads";

const STEPS = ["Placement", "Schedule", "Creative", "Review"] as const;

/** A YYYY-MM-DD string `days` from now, for the date input. */
function dayInputValue(daysFromNow: number): string {
  return new Date(Date.now() + daysFromNow * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

/**
 * Format a booked day for display.
 *
 * Pinned to UTC because campaign days ARE UTC days — rendering them in the
 * browser's zone would show a booking starting "Feb 28" to a reader in Los
 * Angeles when the slot they bought begins on March 1.
 */
function fmtDay(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

type Availability = {
  capacity: number;
  taken: number;
  available: number;
  isAvailable: boolean;
};

/**
 * Four-step campaign builder.
 *
 * Split into steps rather than one long form because the four decisions are
 * genuinely independent, and a single wall of twelve fields is where self-serve
 * advertising loses people. Each step validates before it lets you move on, so
 * a mistake surfaces next to the field that caused it instead of as a server
 * error at the end.
 *
 * Two panels on the right do the persuading: the live preview renders the exact
 * card a reader would see, and the quote shows the whole price — day rate,
 * length, discount, total — with no "estimated" anything. That honesty is the
 * point of flat pricing. The old builder could only promise an ESTIMATED number
 * of impressions for a budget, which is a guess dressed as a number and reads
 * worst on exactly the small site this is for.
 */
export default function CampaignBuilder({
  defaultEmail,
}: {
  defaultEmail: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [placement, setPlacement] = useState<AdPlacement>("feed");
  const [days, setDays] = useState(30);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [website, setWebsite] = useState("");
  const [contactEmail, setContactEmail] = useState(defaultEmail);
  const [startDate, setStartDate] = useState(dayInputValue(1));

  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [ctaLabel, setCtaLabel] = useState("Learn more");

  const [availability, setAvailability] = useState<Availability | null>(null);
  const [checkingSlot, setCheckingSlot] = useState(false);

  // The same function the server prices with, so the number on screen is the
  // number that gets charged rather than a lookalike computed twice.
  const quote = useMemo(() => quotePrice(placement, days), [placement, days]);

  const runWindow = useMemo(() => {
    const start = utcMidnight(new Date(`${startDate}T00:00:00Z`));
    const end = endDateFor(start, days);
    // endDate is exclusive; the last day the ad actually runs is the day before.
    const lastDay = new Date(end.getTime() - 86_400_000);
    return { start, end, lastDay };
  }, [startDate, days]);

  /**
   * Ask the server whether this placement is free for these dates.
   *
   * Debounced, and every in-flight request is aborted when the inputs change
   * again — otherwise a slow answer for last week's dates can land after a fast
   * one for this week's and quietly overwrite it with the wrong verdict.
   */
  const abortRef = useRef<AbortController | null>(null);
  const checkAvailability = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setCheckingSlot(true);
    try {
      const params = new URLSearchParams({
        placement,
        days: String(days),
        startDate,
      });
      const res = await fetch(`/api/ads/availability?${params}`, {
        signal: controller.signal,
      });
      if (!res.ok) {
        // Advisory only — a failed check must not block someone from booking.
        // The submit handler re-checks server-side and is the real gate.
        setAvailability(null);
        return;
      }
      setAvailability(await res.json());
    } catch {
      setAvailability(null);
    } finally {
      if (!controller.signal.aborted) setCheckingSlot(false);
    }
  }, [placement, days, startDate]);

  useEffect(() => {
    if (!startDate || days < MIN_CAMPAIGN_DAYS) return;
    const timer = setTimeout(checkAvailability, 350);
    return () => clearTimeout(timer);
  }, [checkAvailability, startDate, days]);

  /**
   * Add https:// to a bare domain, mirroring what the server does.
   *
   * Typing "codolve.com" instead of "https://codolve.com" is the single most
   * common way to fail this form, and rejecting it helps nobody. Only a value
   * with no scheme at all is touched, so "javascript:..." is passed through
   * unchanged and still rejected by the checks below and on the server.
   *
   * The scheme test excludes dots deliberately — kept in step with the server
   * (src/lib/ads/validate.ts), where the reasoning is spelled out: a dot-free
   * prefix is a real scheme, a dotted one is a hostname like "example.com:8080".
   */
  function normalizeUrl(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) return "";
    return /^[a-zA-Z][a-zA-Z0-9+-]*:/.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
  }

  /** Shared shape check, so every URL field reports the same way. */
  function urlError(value: string, label: string): string | null {
    const normalized = normalizeUrl(value);
    if (!/^https?:\/\//i.test(normalized)) {
      return `${label} must be a http:// or https:// address.`;
    }
    try {
      const url = new URL(normalized);
      if (!url.hostname.includes(".")) {
        return `${label} needs a full domain, like https://example.com`;
      }
    } catch {
      return `${label} doesn't look like a valid web address.`;
    }
    return null;
  }

  /** Per-step gate. Returns an error message, or null when the step is good. */
  function stepError(index: number): string | null {
    if (index === 1) {
      if (!name.trim()) return "Give your campaign a name.";
      if (!Number.isInteger(days) || days < MIN_CAMPAIGN_DAYS) {
        return `The shortest booking is ${MIN_CAMPAIGN_DAYS} days.`;
      }
      if (days > MAX_CAMPAIGN_DAYS) {
        return `The longest booking is ${MAX_CAMPAIGN_DAYS} days.`;
      }
      if (!startDate) return "Pick a start date.";
      if (runWindow.start < utcMidnight(Date.now() - 86_400_000)) {
        return "The start date can't be in the past.";
      }
      // Was missing entirely: an unschemed company website passed every client
      // check and then failed on the server two steps later, with a message
      // that named the destination URL instead.
      if (website.trim()) {
        const err = urlError(website, "Company website");
        if (err) return err;
      }
    }
    if (index === 2) {
      if (!headline.trim()) return "Write a headline.";
      if (!destinationUrl.trim()) return "Where should the click go?";
      const destErr = urlError(destinationUrl, "Destination URL");
      if (destErr) return destErr;
      if (imageUrl.trim()) {
        const imgErr = urlError(imageUrl, "Image URL");
        if (imgErr) return imgErr;
      }
    }
    return null;
  }

  function next() {
    const err = stepError(step);
    if (err) {
      showToast(err, "error");
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function submit(thenSubmitForReview: boolean) {
    // Guard re-entry: without this a double-click fires two POSTs and shows
    // the same validation toast twice.
    if (saving) return;

    for (let i = 0; i < STEPS.length; i++) {
      const err = stepError(i);
      if (err) {
        showToast(err, "error");
        setStep(i);
        return;
      }
    }

    // A draft can always be saved; only a submission needs a free slot. Saying
    // so here saves a round trip, though the server check is what binds.
    if (thenSubmitForReview && availability && !availability.isAvailable) {
      showToast(
        `That ${AD_PLACEMENTS[placement].name} slot is fully booked for those dates. Change the dates or the placement, or save this as a draft.`,
        "error",
      );
      setStep(1);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/ads/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Placement and days are all the server needs to price this — it looks
        // the rate up itself, so no total is sent and none could be forged.
        // The URLs go normalized, so what gets stored is exactly what the
        // preview showed and the server has nothing left to reject.
        body: JSON.stringify({
          name,
          company,
          website: normalizeUrl(website),
          contactEmail,
          placement,
          days,
          startDate,
          creative: {
            headline,
            body,
            imageUrl: normalizeUrl(imageUrl),
            destinationUrl: normalizeUrl(destinationUrl),
            ctaLabel,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not save the campaign.");

      if (thenSubmitForReview) {
        const submitRes = await fetch(`/api/ads/campaigns/${data.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "submit" }),
        });
        const submitData = await submitRes.json();
        if (!submitRes.ok) {
          // The campaign exists as a draft; say so rather than implying it was lost.
          throw new Error(
            submitData?.error ||
              "Saved as a draft, but we couldn't submit it for review.",
          );
        }
        showToast("Submitted for review. We'll email you within 24 hours.", "success");
      } else {
        showToast("Saved as a draft.", "success");
      }

      router.push(`/advertise/campaigns/${data.id}`);
    } catch (err: any) {
      showToast(err?.message || "Something went wrong.", "error");
    } finally {
      setSaving(false);
    }
  }

  const input =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white";
  const label =
    "mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300";

  const isPackage = AD_DURATIONS.some((d) => d.days === days);

  return (
    <>
      <div className="mb-6">
        <Link
          href="/advertise/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <FaArrowLeft /> Back to campaigns
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
          New campaign
        </h1>
      </div>

      {/* ── STEPPER ──────────────────────────────────────────────────── */}
      <ol className="mb-6 flex flex-wrap items-center gap-2">
        {STEPS.map((s, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <li key={s} className="flex items-center gap-2">
              <button
                onClick={() => i < step && setStep(i)}
                disabled={i > step}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  current
                    ? "bg-blue-600 text-white"
                    : done
                      ? "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300"
                      : "text-gray-400 dark:text-gray-600"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                    current
                      ? "bg-white text-blue-600"
                      : done
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-500 dark:bg-gray-800"
                  }`}
                >
                  {done ? <FaCheck className="text-[9px]" /> : i + 1}
                </span>
                {s}
              </button>
              {i < STEPS.length - 1 && (
                <span className="text-gray-300 dark:text-gray-700">/</span>
              )}
            </li>
          );
        })}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        {/* ── FORM ───────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          {step === 0 && (
            <>
              <h2 className="mb-1 text-lg font-bold text-gray-900 dark:text-white">
                Where should it run?
              </h2>
              <p className="mb-5 text-sm text-gray-600 dark:text-gray-400">
                One flat price per day. No impression counting, no bidding, no
                spend to monitor.
              </p>

              <div className="space-y-3">
                {Object.values(AD_PLACEMENTS).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlacement(p.id)}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      placement === p.id
                        ? "border-blue-500 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/30"
                        : "border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {p.name}
                      </span>
                      <span className="shrink-0 text-sm font-bold text-gray-900 dark:text-white">
                        {formatCentsShort(p.dayRateCents)}
                        <span className="font-normal text-gray-500"> / day</span>
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {p.description}
                    </p>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {p.surface} · only {p.maxConcurrent} advertiser
                      {p.maxConcurrent === 1 ? "" : "s"} share this slot at a time
                    </p>
                  </button>
                ))}
              </div>

              <p className="mt-5 rounded-lg bg-gray-50 px-3 py-2.5 text-xs text-gray-600 dark:bg-gray-800/60 dark:text-gray-400">
                We cap how many campaigns run in a slot on purpose. A flat day
                rate is only fair if the day you paid for isn&apos;t split
                between a dozen advertisers.
              </p>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="mb-1 text-lg font-bold text-gray-900 dark:text-white">
                How long, and from when?
              </h2>
              <p className="mb-5 text-sm text-gray-600 dark:text-gray-400">
                You pay once, up front, and your ad runs for every day you
                booked. Longer bookings cost less per day.
              </p>

              <div className="space-y-4">
                <div>
                  <label className={label}>Campaign name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={AD_LIMITS.campaignName}
                    placeholder="Spring launch — developer tools"
                    className={input}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={label}>Company</label>
                    <input
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      maxLength={AD_LIMITS.company}
                      placeholder="Acme Inc."
                      className={input}
                    />
                  </div>
                  <div>
                    <label className={label}>Contact email</label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className={input}
                    />
                  </div>
                </div>

                <div>
                  <label className={label}>Company website</label>
                  <input
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    onBlur={() => setWebsite(normalizeUrl(website))}
                    placeholder="https://acme.com"
                    className={input}
                  />
                </div>

                {/* ── DURATION ─────────────────────────────────────── */}
                <div>
                  <span className={label}>How long should it run?</span>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {AD_DURATIONS.map((option) => {
                      const optionQuote = quotePrice(placement, option.days);
                      const selected = days === option.days;
                      return (
                        <button
                          key={option.days}
                          onClick={() => setDays(option.days)}
                          className={`rounded-xl border p-3 text-left transition ${
                            selected
                              ? "border-blue-500 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/30"
                              : "border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700"
                          }`}
                        >
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {option.label}
                          </p>
                          <p className="mt-0.5 text-lg font-bold text-gray-900 dark:text-white">
                            {formatCentsShort(optionQuote.priceCents)}
                          </p>
                          {option.note && (
                            <p
                              className={`mt-0.5 text-[11px] font-semibold ${
                                option.discountPercent > 0
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-gray-500 dark:text-gray-400"
                              }`}
                            >
                              {option.note}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <label className="text-xs text-gray-500 dark:text-gray-400">
                      Or a custom length:
                    </label>
                    <input
                      type="number"
                      min={MIN_CAMPAIGN_DAYS}
                      max={MAX_CAMPAIGN_DAYS}
                      value={days}
                      onChange={(e) => setDays(Math.floor(Number(e.target.value)) || 0)}
                      className="w-24 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      days
                      {!isPackage && quote.discountPercent > 0 && (
                        <> — {quote.discountPercent}% off applied</>
                      )}
                    </span>
                  </div>
                </div>

                <div>
                  <label className={label}>Start date</label>
                  <input
                    type="date"
                    value={startDate}
                    min={dayInputValue(0)}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={input}
                  />
                  {days >= MIN_CAMPAIGN_DAYS && startDate && (
                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                      Runs {fmtDay(runWindow.start)} through {fmtDay(runWindow.lastDay)}
                      , inclusive.
                    </p>
                  )}
                </div>

                {/* ── SLOT AVAILABILITY ────────────────────────────── */}
                <SlotNotice
                  checking={checkingSlot}
                  availability={availability}
                  placementName={AD_PLACEMENTS[placement].name}
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="mb-1 text-lg font-bold text-gray-900 dark:text-white">
                Your ad
              </h2>
              <p className="mb-5 text-sm text-gray-600 dark:text-gray-400">
                Keep it short and specific. The preview on the right is exactly
                what readers see.
              </p>

              <div className="space-y-4">
                <div>
                  <label className={label}>
                    Headline{" "}
                    <span className="font-normal text-gray-400">
                      {headline.length}/{AD_LIMITS.headline}
                    </span>
                  </label>
                  <input
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    maxLength={AD_LIMITS.headline}
                    placeholder="Ship your API docs in an afternoon"
                    className={input}
                  />
                </div>

                <div>
                  <label className={label}>
                    Body{" "}
                    <span className="font-normal text-gray-400">
                      {body.length}/{AD_LIMITS.body}
                    </span>
                  </label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    maxLength={AD_LIMITS.body}
                    rows={3}
                    placeholder="Generate a full reference site from your OpenAPI spec. Free for open source."
                    className={input}
                  />
                </div>

                <div>
                  <label className={label}>Image URL (optional)</label>
                  <input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    onBlur={() => setImageUrl(normalizeUrl(imageUrl))}
                    placeholder="https://acme.com/banner.png"
                    className={input}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
                  <div>
                    <label className={label}>Destination URL</label>
                    <input
                      value={destinationUrl}
                      onChange={(e) => setDestinationUrl(e.target.value)}
                      onBlur={() => setDestinationUrl(normalizeUrl(destinationUrl))}
                      placeholder="https://acme.com/pricing"
                      className={input}
                    />
                  </div>
                  <div>
                    <label className={label}>Button label</label>
                    <input
                      value={ctaLabel}
                      onChange={(e) => setCtaLabel(e.target.value)}
                      maxLength={AD_LIMITS.ctaLabel}
                      className={input}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="mb-1 text-lg font-bold text-gray-900 dark:text-white">
                Ready to submit
              </h2>
              <p className="mb-5 text-sm text-gray-600 dark:text-gray-400">
                We review every campaign by hand, usually within 24 hours.
                You&apos;re not charged until it&apos;s approved.
              </p>

              <dl className="divide-y divide-gray-100 text-sm dark:divide-gray-800">
                {[
                  ["Campaign", name || "—"],
                  ["Placement", AD_PLACEMENTS[placement].name],
                  [
                    "Length",
                    `${days} days at ${formatCentsShort(quote.dayRateCents)}/day`,
                  ],
                  [
                    "Runs",
                    `${fmtDay(runWindow.start)} – ${fmtDay(runWindow.lastDay)}`,
                  ],
                  ...(quote.discountPercent > 0
                    ? [
                        [
                          "Length discount",
                          `−${formatCents(quote.savingsCents)} (${quote.discountPercent}%)`,
                        ] as [string, string],
                      ]
                    : []),
                  ["Total", formatCents(quote.priceCents)],
                  ["Destination", destinationUrl || "—"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 py-2.5">
                    <dt className="text-gray-500 dark:text-gray-400">{k}</dt>
                    <dd className="truncate text-right font-medium text-gray-900 dark:text-white">
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>

              <p className="mt-4 rounded-lg bg-gray-50 px-3 py-2.5 text-xs text-gray-600 dark:bg-gray-800/60 dark:text-gray-400">
                {formatCents(quote.priceCents)} is the whole cost. Nothing is
                metered and there is nothing further to pay. If review or
                checkout runs past your start date, we move the start to the day
                you pay so you still get all {days} days.
              </p>
            </>
          )}

          {/* ── NAV ──────────────────────────────────────────────────── */}
          <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-5 dark:border-gray-800">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0 || saving}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              Back
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={next}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Continue <FaArrowRight />
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => submit(false)}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Save draft
                </button>
                <button
                  onClick={() => submit(true)}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Submitting…" : "Submit for review"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── PREVIEW + QUOTE ────────────────────────────────────────── */}
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Preview
            </p>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
              {imageUrl && placement !== "sidebar" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt=""
                  className="h-32 w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
              <div className="p-4">
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  Sponsored
                </span>
                <h3 className="mt-2 font-semibold leading-snug text-gray-900 dark:text-white">
                  {headline || "Your headline goes here"}
                </h3>
                {(body || !headline) && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {body || "A sentence about what you're offering."}
                  </p>
                )}
                <span className="mt-3 inline-block text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {ctaLabel || "Learn more"} →
                </span>
              </div>
            </div>
          </div>

          {/* The quote. Every line is exact — this is what the card is charged. */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Your booking
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {formatCents(quote.priceCents)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {AD_PLACEMENTS[placement].name} · {days} day
              {days === 1 ? "" : "s"}
            </p>

            <dl className="mt-4 space-y-1.5 border-t border-gray-100 pt-3 text-xs dark:border-gray-800">
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">
                  {formatCentsShort(quote.dayRateCents)} × {days} days
                </dt>
                <dd className="text-gray-700 dark:text-gray-300">
                  {formatCents(quote.grossCents)}
                </dd>
              </div>
              {quote.discountPercent > 0 && (
                <div className="flex justify-between font-medium text-emerald-600 dark:text-emerald-400">
                  <dt>Length discount ({quote.discountPercent}%)</dt>
                  <dd>−{formatCents(quote.savingsCents)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-100 pt-1.5 font-semibold text-gray-900 dark:border-gray-800 dark:text-white">
                <dt>Total</dt>
                <dd>{formatCents(quote.priceCents)}</dd>
              </div>
            </dl>

            <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
              <FaRegClock className="mt-0.5 shrink-0" />
              Paid once. Nothing metered, nothing to top up.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}

/**
 * Live slot availability for the chosen window.
 *
 * Deliberately shown while the advertiser is still picking dates rather than as
 * a rejection after they have written their copy — a fully booked fortnight is
 * a scheduling problem, and it should read like one.
 */
function SlotNotice({
  checking,
  availability,
  placementName,
}: {
  checking: boolean;
  availability: Availability | null;
  placementName: string;
}) {
  if (checking && !availability) {
    return (
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Checking availability…
      </p>
    );
  }
  // A failed or not-yet-run check stays silent: a scary message about
  // availability we could not determine is worse than no message.
  if (!availability) return null;

  if (!availability.isAvailable) {
    return (
      <div className="flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
        <FaExclamationTriangle className="mt-0.5 shrink-0 text-amber-500" />
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            Fully booked for those dates
          </p>
          <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
            All {availability.capacity} {placementName} spots are taken for part
            of that window. Try a later start date, a shorter run, or another
            placement — you can still save this as a draft.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
      <FaCheckCircle className="mt-0.5 shrink-0 text-emerald-500" />
      <p className="text-xs text-emerald-800 dark:text-emerald-300">
        <strong>Available</strong> — {availability.available} of{" "}
        {availability.capacity} {placementName} spots open for those dates.
      </p>
    </div>
  );
}
