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
  MAX_LEAD_DAYS,
  MIN_CAMPAIGN_DAYS,
  endDateFor,
  formatCents,
  formatCentsShort,
  quotePrice,
  utcMidnight,
  type AdPlacement,
} from "@/config/ads";

const STEPS = ["Placement", "Schedule", "Your ad", "Review"] as const;

/** A YYYY-MM-DD string `days` from now, for the date input. */
function dayInputValue(daysFromNow: number): string {
  return new Date(Date.now() + daysFromNow * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

/**
 * Format a booked day for display.
 *
 * Pinned to UTC because campaign days ARE UTC days: rendering them in the
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

/** An existing draft or rejected campaign, opened for editing. */
export type EditableCampaign = {
  id: string;
  name: string;
  company: string;
  website: string;
  contactEmail: string;
  placement: AdPlacement;
  days: number;
  /** YYYY-MM-DD (UTC). */
  startDate: string;
  headline: string;
  body: string;
  imageUrl: string;
  destinationUrl: string;
  ctaLabel: string;
  /** The reviewer's reason, when the campaign was rejected. */
  reviewNote?: string;
};

type Field =
  | "name"
  | "company"
  | "contactEmail"
  | "website"
  | "days"
  | "startDate"
  | "headline"
  | "body"
  | "imageUrl"
  | "destinationUrl"
  | "ctaLabel";

type FieldErrors = Partial<Record<Field, string>>;

/** DOM id for a field, so errors can point at it and focus can land on it. */
const fid = (field: Field) => `campaign-${field}`;

/** Fields in page order, used to focus the first one that needs fixing. */
const FIELD_ORDER: Field[] = [
  "name",
  "company",
  "contactEmail",
  "website",
  "days",
  "startDate",
  "headline",
  "body",
  "imageUrl",
  "destinationUrl",
  "ctaLabel",
];

/**
 * Which step a server error belongs to, so the advertiser lands where the fix
 * is instead of reading about a field on a screen that doesn't show it.
 */
function stepForServerMessage(message: string): number | null {
  const m = message.toLowerCase();
  if (/(headline|destination|image|button|body|creative)/.test(m)) return 2;
  if (/(campaign name|company|email|website|start|days|booking|slot|date)/.test(m))
    return 1;
  return null;
}

/**
 * Four-step campaign builder, used both to create a campaign and to edit a
 * draft or rejected one.
 *
 * Split into steps rather than one long form because the four decisions are
 * genuinely independent, and a single wall of twelve fields is where self-serve
 * advertising loses people. Each step validates before it lets you move on, and
 * a problem is shown next to the field that caused it (not in a toast that
 * disappears before it has been read).
 *
 * Two panels on the right do the persuading: the live preview renders the same
 * card a reader would see, and the quote shows the whole price (day rate,
 * length, discount, total) with no "estimated" anything.
 */
export default function CampaignBuilder({
  defaultEmail,
  existing,
}: {
  defaultEmail: string;
  existing?: EditableCampaign;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const isEdit = !!existing;

  const [step, setStep] = useState(0);
  // Furthest step reached. An existing campaign is already complete, so every
  // step is open from the start.
  const [maxReached, setMaxReached] = useState(isEdit ? STEPS.length - 1 : 0);
  const [saving, setSaving] = useState<"draft" | "submit" | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const [placement, setPlacement] = useState<AdPlacement>(
    existing?.placement ?? "feed",
  );
  const [days, setDays] = useState(existing?.days ?? 30);
  const [name, setName] = useState(existing?.name ?? "");
  const [company, setCompany] = useState(existing?.company ?? "");
  const [website, setWebsite] = useState(existing?.website ?? "");
  const [contactEmail, setContactEmail] = useState(
    existing?.contactEmail || defaultEmail,
  );
  const [startDate, setStartDate] = useState(
    existing?.startDate ?? dayInputValue(1),
  );

  const [headline, setHeadline] = useState(existing?.headline ?? "");
  const [body, setBody] = useState(existing?.body ?? "");
  const [imageUrl, setImageUrl] = useState(existing?.imageUrl ?? "");
  const [destinationUrl, setDestinationUrl] = useState(
    existing?.destinationUrl ?? "",
  );
  const [ctaLabel, setCtaLabel] = useState(existing?.ctaLabel || "Learn more");

  const [availability, setAvailability] = useState<Availability | null>(null);
  const [checkingSlot, setCheckingSlot] = useState(false);

  // ── Unsaved-changes guard ────────────────────────────────────────────
  const snapshot = JSON.stringify([
    placement,
    days,
    name,
    company,
    website,
    contactEmail,
    startDate,
    headline,
    body,
    imageUrl,
    destinationUrl,
    ctaLabel,
  ]);
  const [initialSnapshot] = useState(snapshot);
  const dirty = snapshot !== initialSnapshot;
  // Set once the campaign is safely stored, so navigating to it isn't blocked.
  const savedRef = useRef(false);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      if (savedRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function confirmLeave(e: React.MouseEvent) {
    if (
      dirty &&
      !savedRef.current &&
      !window.confirm("Leave without saving? Your changes will be lost.")
    ) {
      e.preventDefault();
    }
  }

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
   * again. Otherwise a slow answer for last week's dates can land after a fast
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
        // Advisory only: a failed check must not block someone from booking.
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
   * The scheme test excludes dots deliberately, kept in step with the server
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
      return `${label} must be an http:// or https:// address.`;
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

  /** Every problem on one step, keyed by the field it belongs to. */
  function stepErrors(index: number): FieldErrors {
    const errs: FieldErrors = {};
    if (index === 1) {
      if (!name.trim()) errs.name = "Give your campaign a name.";
      if (
        contactEmail.trim() &&
        !/^\S+@\S+\.\S+$/.test(contactEmail.trim())
      ) {
        errs.contactEmail = "That email address doesn't look right.";
      }
      // An unschemed website used to pass here and then fail on the server
      // two steps later, with a message that named a different field.
      if (website.trim()) {
        const err = urlError(website, "Company website");
        if (err) errs.website = err;
      }
      if (!Number.isInteger(days) || days < MIN_CAMPAIGN_DAYS) {
        errs.days = `The shortest booking is ${MIN_CAMPAIGN_DAYS} days.`;
      } else if (days > MAX_CAMPAIGN_DAYS) {
        errs.days = `The longest booking is ${MAX_CAMPAIGN_DAYS} days.`;
      }
      if (!startDate) {
        errs.startDate = "Pick a start date.";
      } else if (runWindow.start < utcMidnight(Date.now() - 86_400_000)) {
        errs.startDate = "The start date can't be in the past.";
      } else if (
        runWindow.start > utcMidnight(Date.now() + MAX_LEAD_DAYS * 86_400_000)
      ) {
        errs.startDate = `You can book up to ${MAX_LEAD_DAYS} days ahead.`;
      }
    }
    if (index === 2) {
      if (!headline.trim()) errs.headline = "Write a headline.";
      if (!destinationUrl.trim()) {
        errs.destinationUrl = "Add the page people should land on.";
      } else {
        const err = urlError(destinationUrl, "Destination URL");
        if (err) errs.destinationUrl = err;
      }
      if (imageUrl.trim()) {
        const err = urlError(imageUrl, "Image URL");
        if (err) errs.imageUrl = err;
      }
      if (!ctaLabel.trim()) errs.ctaLabel = "Add a button label.";
    }
    return errs;
  }

  function showErrors(errs: FieldErrors) {
    setErrors(errs);
    const first = FIELD_ORDER.find((f) => errs[f]);
    if (first) {
      // After React paints the step that holds the field.
      requestAnimationFrame(() => document.getElementById(fid(first))?.focus());
    }
  }

  /** Clear a field's error as soon as the advertiser starts fixing it. */
  function clearError(field: Field) {
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function goTo(index: number) {
    setFormError(null);
    setStep(index);
  }

  function next() {
    const errs = stepErrors(step);
    if (Object.keys(errs).length > 0) {
      showErrors(errs);
      return;
    }
    const target = Math.min(step + 1, STEPS.length - 1);
    setMaxReached((m) => Math.max(m, target));
    goTo(target);
  }

  async function save(submitForReview: boolean) {
    // Guard re-entry: a double-click must not create two campaigns.
    if (saving) return;
    setFormError(null);

    for (let i = 0; i < STEPS.length; i++) {
      const errs = stepErrors(i);
      if (Object.keys(errs).length > 0) {
        setStep(i);
        showErrors(errs);
        return;
      }
    }

    // A draft can always be saved; only a submission needs a free slot. Saying
    // so here saves a round trip, though the server check is what binds.
    if (submitForReview && availability && !availability.isAvailable) {
      setStep(1);
      setFormError(
        `The ${AD_PLACEMENTS[placement].name} spot is fully booked for those dates. Change the dates or the placement, or save this as a draft for now.`,
      );
      return;
    }

    setSaving(submitForReview ? "submit" : "draft");

    // Placement and days are all the server needs to price this: it looks the
    // rate up itself, so no total is sent and none could be forged. The URLs
    // go normalized, so what gets stored is exactly what the preview showed.
    const payload = {
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
    };

    let campaignId = existing?.id ?? null;
    try {
      const res = campaignId
        ? await fetch(`/api/ads/campaigns/${campaignId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "update", ...payload }),
          })
        : await fetch("/api/ads/campaigns", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not save the campaign.");
      campaignId = campaignId ?? data.id;
    } catch (err: any) {
      const message = err?.message || "Something went wrong. Please try again.";
      const target = stepForServerMessage(message);
      if (target !== null) setStep(target);
      setFormError(message);
      setSaving(null);
      return;
    }

    // From here the campaign exists. Whatever happens next, go to it rather
    // than staying on this form, where a retry would create a duplicate.
    savedRef.current = true;

    if (submitForReview) {
      try {
        const submitRes = await fetch(`/api/ads/campaigns/${campaignId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "submit" }),
        });
        const submitData = await submitRes.json();
        if (!submitRes.ok) {
          throw new Error(submitData?.error || "It couldn't be submitted.");
        }
        showToast(
          "Submitted for review. We'll email you within 24 hours.",
          "success",
        );
      } catch (err: any) {
        showToast(
          `Your changes are saved, but the campaign wasn't submitted. ${err?.message ?? ""}`.trim(),
          "error",
        );
      }
    } else {
      showToast(isEdit ? "Changes saved." : "Draft saved.", "success");
    }

    // `saving` stays set: the page is navigating away, and re-enabling the
    // buttons now would only invite a second click.
    router.push(`/advertise/campaigns/${campaignId}`);
    router.refresh();
  }

  const inputBase =
    "w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:ring-2 dark:bg-gray-900 dark:text-white";
  const inputClass = (field: Field) =>
    `${inputBase} ${
      errors[field]
        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500"
        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 dark:border-gray-700"
    }`;
  const labelClass =
    "mb-1.5 flex items-baseline justify-between gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300";
  const aria = (field: Field) => ({
    id: fid(field),
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": errors[field] ? `${fid(field)}-error` : undefined,
  });

  const isPackage = AD_DURATIONS.some((d) => d.days === days);
  const isSidebar = placement === "sidebar";
  const previewImage =
    imageUrl.trim() && !urlError(imageUrl, "Image URL")
      ? normalizeUrl(imageUrl)
      : "";
  const backHref = existing
    ? `/advertise/campaigns/${existing.id}`
    : "/advertise/dashboard";

  return (
    <>
      <div className="mb-6">
        <Link
          href={backHref}
          onClick={confirmLeave}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <FaArrowLeft /> {isEdit ? "Back to campaign" : "Back to campaigns"}
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
          {isEdit ? "Edit campaign" : "New campaign"}
        </h1>
      </div>

      {existing?.reviewNote && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
          <p className="font-semibold text-red-800 dark:text-red-300">
            What our reviewer asked you to change
          </p>
          <p className="mt-1 text-sm text-red-700 dark:text-red-400">
            {existing.reviewNote}
          </p>
        </div>
      )}

      {/* ── STEPPER ──────────────────────────────────────────────────── */}
      <nav aria-label="Campaign steps">
        <ol className="mb-6 flex flex-wrap items-center gap-2">
          {STEPS.map((s, i) => {
            const done = i < step || (i <= maxReached && i !== step);
            const current = i === step;
            const reachable = i <= maxReached;
            return (
              <li key={s} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => reachable && !current && goTo(i)}
                  disabled={!reachable}
                  aria-current={current ? "step" : undefined}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    current
                      ? "bg-blue-600 text-white"
                      : done
                        ? "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300"
                        : "text-gray-500 dark:text-gray-500"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                      current
                        ? "bg-white text-blue-600"
                        : done
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {done ? <FaCheck className="text-[9px]" /> : i + 1}
                  </span>
                  {s}
                </button>
                {i < STEPS.length - 1 && (
                  <span aria-hidden="true" className="text-gray-300 dark:text-gray-700">
                    /
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        {/* ── FORM ───────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-gray-900">
          {step === 0 && (
            <>
              <h2 className="mb-1 text-lg font-bold text-gray-900 dark:text-white">
                Where should it run?
              </h2>
              <p className="mb-5 text-sm text-gray-600 dark:text-gray-400">
                One flat price per day. No bidding and no spend to watch. All
                prices in USD.
              </p>

              <div role="radiogroup" aria-label="Placement" className="space-y-3">
                {Object.values(AD_PLACEMENTS).map((p) => {
                  const selected = placement === p.id;
                  return (
                    <button
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      key={p.id}
                      onClick={() => setPlacement(p.id)}
                      className={`w-full rounded-xl border p-4 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                        selected
                          ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500 dark:border-blue-500 dark:bg-blue-950/30"
                          : "border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                          {selected ? (
                            <FaCheckCircle className="text-blue-600 dark:text-blue-400" />
                          ) : (
                            <span className="h-4 w-4 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                          )}
                          {p.name}
                        </span>
                        <span className="shrink-0 text-sm font-bold text-gray-900 dark:text-white">
                          {formatCentsShort(p.dayRateCents)}
                          <span className="font-normal text-gray-500 dark:text-gray-400">
                            {" "}
                            / day
                          </span>
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {p.description}
                      </p>
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {p.surface} · at most {p.maxConcurrent} advertiser
                        {p.maxConcurrent === 1 ? "" : "s"} share this spot at a
                        time
                      </p>
                    </button>
                  );
                })}
              </div>

              <p className="mt-5 rounded-lg bg-gray-50 px-3 py-2.5 text-xs text-gray-600 dark:bg-gray-800/60 dark:text-gray-400">
                We cap how many campaigns run in a spot on purpose. A flat day
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
                You pay once, after your ad is approved, and it runs for every
                day you booked. Longer bookings cost less per day.
              </p>
              <RequiredNote />

              <div className="space-y-4">
                <div>
                  <label htmlFor={fid("name")} className={labelClass}>
                    <span>
                      Campaign name <Req />
                    </span>
                    <Counter value={name} max={AD_LIMITS.campaignName} />
                  </label>
                  <input
                    {...aria("name")}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      clearError("name");
                    }}
                    maxLength={AD_LIMITS.campaignName}
                    placeholder="Spring launch: developer tools"
                    className={inputClass("name")}
                  />
                  <HelpText>Only you see this name.</HelpText>
                  <FieldError field="name" errors={errors} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor={fid("company")} className={labelClass}>
                      <span>
                        Company <Opt />
                      </span>
                      <Counter value={company} max={AD_LIMITS.company} />
                    </label>
                    <input
                      {...aria("company")}
                      value={company}
                      onChange={(e) => {
                        setCompany(e.target.value);
                        clearError("company");
                      }}
                      maxLength={AD_LIMITS.company}
                      placeholder="Acme Inc."
                      className={inputClass("company")}
                    />
                    <FieldError field="company" errors={errors} />
                  </div>
                  <div>
                    <label htmlFor={fid("contactEmail")} className={labelClass}>
                      <span>
                        Contact email <Opt />
                      </span>
                    </label>
                    <input
                      {...aria("contactEmail")}
                      type="email"
                      value={contactEmail}
                      onChange={(e) => {
                        setContactEmail(e.target.value);
                        clearError("contactEmail");
                      }}
                      className={inputClass("contactEmail")}
                    />
                    <HelpText>We send the review decision here.</HelpText>
                    <FieldError field="contactEmail" errors={errors} />
                  </div>
                </div>

                <div>
                  <label htmlFor={fid("website")} className={labelClass}>
                    <span>
                      Company website <Opt />
                    </span>
                  </label>
                  <input
                    {...aria("website")}
                    value={website}
                    onChange={(e) => {
                      setWebsite(e.target.value);
                      clearError("website");
                    }}
                    onBlur={() => setWebsite(normalizeUrl(website))}
                    placeholder="https://acme.com"
                    className={inputClass("website")}
                  />
                  <FieldError field="website" errors={errors} />
                </div>

                {/* ── DURATION ─────────────────────────────────────── */}
                <fieldset>
                  <legend className="mb-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    How long should it run? <Req />
                  </legend>
                  <div
                    role="radiogroup"
                    aria-label="Booking length"
                    className="grid grid-cols-2 gap-3 sm:grid-cols-4"
                  >
                    {AD_DURATIONS.map((option) => {
                      const optionQuote = quotePrice(placement, option.days);
                      const selected = days === option.days;
                      return (
                        <button
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          key={option.days}
                          onClick={() => {
                            setDays(option.days);
                            clearError("days");
                          }}
                          className={`relative rounded-xl border p-3 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                            selected
                              ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500 dark:border-blue-500 dark:bg-blue-950/30"
                              : "border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700"
                          }`}
                        >
                          {selected && (
                            <FaCheckCircle className="absolute right-2.5 top-2.5 text-sm text-blue-600 dark:text-blue-400" />
                          )}
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
                                  ? "text-emerald-700 dark:text-emerald-400"
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
                    <label
                      htmlFor={fid("days")}
                      className="text-xs text-gray-600 dark:text-gray-400"
                    >
                      Or a custom length:
                    </label>
                    <input
                      {...aria("days")}
                      type="number"
                      inputMode="numeric"
                      min={MIN_CAMPAIGN_DAYS}
                      max={MAX_CAMPAIGN_DAYS}
                      value={days}
                      onChange={(e) => {
                        setDays(Math.floor(Number(e.target.value)) || 0);
                        clearError("days");
                      }}
                      className={`${inputClass("days")} w-24! py-1.5`}
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      days ({MIN_CAMPAIGN_DAYS} to {MAX_CAMPAIGN_DAYS})
                      {!isPackage && quote.discountPercent > 0 && (
                        <>, {quote.discountPercent}% off applied</>
                      )}
                    </span>
                  </div>
                  <FieldError field="days" errors={errors} />
                </fieldset>

                <div>
                  <label htmlFor={fid("startDate")} className={labelClass}>
                    <span>
                      Start date <Req />
                    </span>
                  </label>
                  <input
                    {...aria("startDate")}
                    type="date"
                    value={startDate}
                    min={dayInputValue(0)}
                    max={dayInputValue(MAX_LEAD_DAYS)}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      clearError("startDate");
                    }}
                    className={inputClass("startDate")}
                  />
                  {days >= MIN_CAMPAIGN_DAYS && startDate && !errors.startDate && (
                    <HelpText>
                      Runs {fmtDay(runWindow.start)} through{" "}
                      {fmtDay(runWindow.lastDay)}. Days start and end at
                      midnight UTC.
                    </HelpText>
                  )}
                  <FieldError field="startDate" errors={errors} />
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
                Keep it short and specific. The preview shows the card readers
                will see.
              </p>
              <RequiredNote />

              <div className="space-y-4">
                <div>
                  <label htmlFor={fid("headline")} className={labelClass}>
                    <span>
                      Headline <Req />
                    </span>
                    <Counter value={headline} max={AD_LIMITS.headline} />
                  </label>
                  <input
                    {...aria("headline")}
                    value={headline}
                    onChange={(e) => {
                      setHeadline(e.target.value);
                      clearError("headline");
                    }}
                    maxLength={AD_LIMITS.headline}
                    placeholder="Ship your API docs in an afternoon"
                    className={inputClass("headline")}
                  />
                  <FieldError field="headline" errors={errors} />
                </div>

                <div>
                  <label htmlFor={fid("body")} className={labelClass}>
                    <span>
                      Description <Opt />
                    </span>
                    <Counter value={body} max={AD_LIMITS.body} />
                  </label>
                  <textarea
                    {...aria("body")}
                    value={body}
                    onChange={(e) => {
                      setBody(e.target.value);
                      clearError("body");
                    }}
                    maxLength={AD_LIMITS.body}
                    rows={3}
                    placeholder="Generate a full reference site from your OpenAPI spec. Free for open source."
                    className={inputClass("body")}
                  />
                  <HelpText>Readers see up to two lines.</HelpText>
                  <FieldError field="body" errors={errors} />
                </div>

                <div>
                  <label htmlFor={fid("imageUrl")} className={labelClass}>
                    <span>
                      Image link <Opt />
                    </span>
                  </label>
                  <input
                    {...aria("imageUrl")}
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      clearError("imageUrl");
                    }}
                    onBlur={() => setImageUrl(normalizeUrl(imageUrl))}
                    placeholder="https://acme.com/banner.png"
                    className={inputClass("imageUrl")}
                  />
                  <HelpText>
                    A direct link to a JPG, PNG or WebP. Wide images (about
                    1200 × 400) suit the feed and articles. The sidebar shows a
                    small square crop.
                  </HelpText>
                  <FieldError field="imageUrl" errors={errors} />
                </div>

                <div className="grid gap-4 sm:grid-cols-[1fr_11rem]">
                  <div>
                    <label htmlFor={fid("destinationUrl")} className={labelClass}>
                      <span>
                        Link to your site <Req />
                      </span>
                    </label>
                    <input
                      {...aria("destinationUrl")}
                      value={destinationUrl}
                      onChange={(e) => {
                        setDestinationUrl(e.target.value);
                        clearError("destinationUrl");
                      }}
                      onBlur={() => setDestinationUrl(normalizeUrl(destinationUrl))}
                      placeholder="https://acme.com/pricing"
                      className={inputClass("destinationUrl")}
                    />
                    <HelpText>Where a click takes the reader.</HelpText>
                    <FieldError field="destinationUrl" errors={errors} />
                  </div>
                  <div>
                    <label htmlFor={fid("ctaLabel")} className={labelClass}>
                      <span>
                        Button text <Req />
                      </span>
                      <Counter value={ctaLabel} max={AD_LIMITS.ctaLabel} />
                    </label>
                    <input
                      {...aria("ctaLabel")}
                      value={ctaLabel}
                      onChange={(e) => {
                        setCtaLabel(e.target.value);
                        clearError("ctaLabel");
                      }}
                      maxLength={AD_LIMITS.ctaLabel}
                      className={inputClass("ctaLabel")}
                    />
                    <FieldError field="ctaLabel" errors={errors} />
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="mb-1 text-lg font-bold text-gray-900 dark:text-white">
                Check and submit
              </h2>
              <p className="mb-5 text-sm text-gray-600 dark:text-gray-400">
                Submitting is free. You&apos;re only charged after a person
                approves your ad.
              </p>

              <dl className="divide-y divide-gray-100 text-sm dark:divide-gray-800">
                {[
                  ["Campaign", name || "Not set"],
                  ["Placement", AD_PLACEMENTS[placement].name],
                  [
                    "Length",
                    `${days} days at ${formatCentsShort(quote.dayRateCents)} a day`,
                  ],
                  [
                    "Runs",
                    `${fmtDay(runWindow.start)} to ${fmtDay(runWindow.lastDay)}`,
                  ],
                  ...(quote.discountPercent > 0
                    ? [
                        [
                          "Length discount",
                          `−${formatCents(quote.savingsCents)} (${quote.discountPercent}%)`,
                        ] as [string, string],
                      ]
                    : []),
                  ["Total (USD)", formatCents(quote.priceCents)],
                  ["Link", normalizeUrl(destinationUrl) || "Not set"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 py-2.5">
                    <dt className="shrink-0 text-gray-600 dark:text-gray-400">
                      {k}
                    </dt>
                    <dd className="min-w-0 break-all text-right font-medium text-gray-900 dark:text-white">
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-5 rounded-xl bg-gray-50 p-4 dark:bg-gray-800/60">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  What happens next
                </p>
                <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-gray-600 dark:text-gray-400">
                  <li>
                    A person reviews your ad, usually within 24 hours. We email{" "}
                    {contactEmail.trim() || "you"} with the decision.
                  </li>
                  <li>
                    Once it&apos;s approved, you pay{" "}
                    {formatCents(quote.priceCents)} (USD) once, from your
                    campaign page. Nothing renews.
                  </li>
                  <li>
                    Your ad runs {fmtDay(runWindow.start)} to{" "}
                    {fmtDay(runWindow.lastDay)}. If you pay after the start
                    date, the dates move so you still get all {days} days.
                  </li>
                </ol>
              </div>
            </>
          )}

          {formError && (
            <div
              role="alert"
              className="mt-5 flex gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
            >
              <FaExclamationTriangle className="mt-0.5 shrink-0" />
              <p>{formError}</p>
            </div>
          )}

          {/* ── NAV ──────────────────────────────────────────────────── */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
            <button
              type="button"
              onClick={() => goTo(Math.max(0, step - 1))}
              disabled={step === 0 || !!saving}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              Back
            </button>

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={next}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Continue <FaArrowRight />
              </button>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => save(false)}
                  disabled={!!saving}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  {saving === "draft"
                    ? "Saving…"
                    : isEdit
                      ? "Save changes"
                      : "Save draft"}
                </button>
                <button
                  type="button"
                  onClick={() => save(true)}
                  disabled={!!saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving === "submit" ? "Submitting…" : "Submit for review"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── PREVIEW + QUOTE ────────────────────────────────────────── */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
              Preview · {AD_PLACEMENTS[placement].name}
            </p>
            {/* Mirrors AdSlot's markup, so this is the card readers get. */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
              {previewImage && !isSidebar && (
                <PreviewImage
                  key={previewImage}
                  src={previewImage}
                  className="h-40 w-full object-cover"
                />
              )}
              <div className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    Sponsored
                  </span>
                </div>
                <div className={isSidebar && previewImage ? "flex gap-3" : ""}>
                  {previewImage && isSidebar && (
                    <PreviewImage
                      key={previewImage}
                      src={previewImage}
                      className="h-14 w-14 shrink-0 rounded-lg object-cover"
                    />
                  )}
                  <div className="min-w-0">
                    <h3 className="font-semibold leading-snug text-gray-900 dark:text-white">
                      {headline || "Your headline goes here"}
                    </h3>
                    {(body || !headline) && (
                      <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                        {body || "A sentence about what you're offering."}
                      </p>
                    )}
                  </div>
                </div>
                <span className="mt-3 inline-block text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {ctaLabel || "Learn more"} →
                </span>
              </div>
            </div>
          </div>

          {/* The quote. Every line is exact: this is what the card is charged. */}
          <div className="hidden rounded-xl border border-gray-200 bg-white p-4 lg:block dark:border-gray-800 dark:bg-gray-900">
            <QuoteDetails quote={quote} placement={placement} days={days} />
          </div>
        </aside>
      </div>

      {/* Phones: the quote panel sits below the form, out of sight while
          editing, so keep the total pinned to the bottom of the screen. */}
      <div className="sticky bottom-0 z-10 -mx-4 mt-6 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden dark:border-gray-800 dark:bg-gray-900/95">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {AD_PLACEMENTS[placement].name} · {days} day{days === 1 ? "" : "s"}
              {quote.discountPercent > 0 && ` · ${quote.discountPercent}% off`}
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {formatCents(quote.priceCents)}{" "}
              <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                USD, paid once after approval
              </span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

/* ──────────────────────────── small pieces ──────────────────────────── */

function Req() {
  return (
    <span className="text-red-600 dark:text-red-400" aria-hidden="true">
      *
    </span>
  );
}

function Opt() {
  return (
    <span className="font-normal text-gray-500 dark:text-gray-400">
      (optional)
    </span>
  );
}

function RequiredNote() {
  return (
    <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
      Fields marked <Req /> are required.
    </p>
  );
}

function HelpText({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">{children}</p>
  );
}

function Counter({ value, max }: { value: string; max: number }) {
  const near = value.length >= max * 0.9;
  return (
    <span
      className={`text-xs font-normal tabular-nums ${
        near ? "text-amber-700 dark:text-amber-400" : "text-gray-500 dark:text-gray-400"
      }`}
    >
      {value.length}/{max}
    </span>
  );
}

function FieldError({ field, errors }: { field: Field; errors: FieldErrors }) {
  if (!errors[field]) return null;
  return (
    <p
      id={`${fid(field)}-error`}
      className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-red-600 dark:text-red-400"
    >
      <FaExclamationTriangle className="mt-0.5 shrink-0" />
      {errors[field]}
    </p>
  );
}

/**
 * Preview image that says so when it can't load, instead of silently
 * vanishing. Keyed by URL by the caller, so fixing a broken link retries.
 */
function PreviewImage({ src, className }: { src: string; className: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        className={`${className} flex items-center justify-center bg-gray-100 p-1 text-center text-[10px] leading-tight text-gray-600 dark:bg-gray-800 dark:text-gray-400`}
      >
        Image couldn&apos;t load
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={className} onError={() => setFailed(true)} />
  );
}

function QuoteDetails({
  quote,
  placement,
  days,
}: {
  quote: ReturnType<typeof quotePrice>;
  placement: AdPlacement;
  days: number;
}) {
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
        Your booking
      </p>

      <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
        {formatCents(quote.priceCents)}
        <span className="ml-1 text-sm font-normal text-gray-500 dark:text-gray-400">
          USD
        </span>
      </p>
      <p className="text-xs text-gray-600 dark:text-gray-400">
        {AD_PLACEMENTS[placement].name} · {days} day{days === 1 ? "" : "s"}
      </p>

      <dl className="mt-4 space-y-1.5 border-t border-gray-100 pt-3 text-xs dark:border-gray-800">
        <div className="flex justify-between">
          <dt className="text-gray-600 dark:text-gray-400">
            {formatCentsShort(quote.dayRateCents)} × {days} days
          </dt>
          <dd className="text-gray-700 dark:text-gray-300">
            {formatCents(quote.grossCents)}
          </dd>
        </div>
        {quote.discountPercent > 0 && (
          <div className="flex justify-between font-medium text-emerald-700 dark:text-emerald-400">
            <dt>Length discount ({quote.discountPercent}%)</dt>
            <dd>−{formatCents(quote.savingsCents)}</dd>
          </div>
        )}
        <div className="flex justify-between border-t border-gray-100 pt-1.5 font-semibold text-gray-900 dark:border-gray-800 dark:text-white">
          <dt>Total</dt>
          <dd>{formatCents(quote.priceCents)}</dd>
        </div>
      </dl>

      <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-gray-600 dark:text-gray-400">
        <FaRegClock className="mt-0.5 shrink-0" />
        Paid once, after approval. Nothing metered, nothing renews.
      </p>
    </>
  );
}

/**
 * Live slot availability for the chosen window.
 *
 * Deliberately shown while the advertiser is still picking dates rather than as
 * a rejection after they have written their copy: a fully booked fortnight is
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
      <p className="text-xs text-gray-600 dark:text-gray-400" aria-live="polite">
        Checking availability…
      </p>
    );
  }
  // A failed or not-yet-run check stays silent: a scary message about
  // availability we could not determine is worse than no message.
  if (!availability) return null;

  if (!availability.isAvailable) {
    return (
      <div
        aria-live="polite"
        className="flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30"
      >
        <FaExclamationTriangle className="mt-0.5 shrink-0 text-amber-600" />
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            Fully booked for those dates
          </p>
          <p className="mt-0.5 text-xs text-amber-800 dark:text-amber-400">
            All {availability.capacity} {placementName} spots are taken for part
            of that window. Try a later start date, a shorter run, or another
            placement. You can still save this as a draft.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      aria-live="polite"
      className="flex gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/30"
    >
      <FaCheckCircle className="mt-0.5 shrink-0 text-emerald-600" />
      <p className="text-xs text-emerald-800 dark:text-emerald-300">
        <strong>Available.</strong> {availability.available} of{" "}
        {availability.capacity} {placementName} spots are open for those dates.
      </p>
    </div>
  );
}
