/**
 * Rate card and rules for the self-serve ad marketplace.
 *
 * We sell TIME, not traffic: an advertiser books a placement for a number of
 * days and pays one fixed price up front. Nothing is metered per impression.
 *
 * Why not CPM/CPC — the obvious model for an ad system? Because performance
 * pricing only works once there is performance to sell. On a young site a $50
 * CPM budget takes months to deliver, so the advertiser's money sits in limbo
 * and their dashboard reads "stalled" through no fault of theirs. A flat day
 * rate is what small publishers and newsletters actually sell, and it is
 * honest at any traffic level: they know exactly what they pay and exactly how
 * long they are up. Impressions and clicks are still tracked in full — as
 * PROOF OF VALUE on the advertiser's dashboard, not as a meter.
 *
 * Money is handled in integer CENTS everywhere. With flat pricing every total
 * is an exact integer by construction (rate x days, one rounding at the
 * discount), so no float ever reaches the database. Only display divides by 100.
 *
 * ── TUNING THIS FILE ───────────────────────────────────────────────────────
 * `dayRateCents` and `maxConcurrent` below are the whole rate card. Change a
 * number here and the pricing page, the campaign builder, the quote, and the
 * Razorpay charge all follow — nothing else needs editing.
 */

export type AdPlacement = "sidebar" | "feed" | "article";

export type PlacementConfig = {
  id: AdPlacement;
  name: string;
  description: string;
  /** Flat price per day, in cents. This is the entire rate card. */
  dayRateCents: number;
  /**
   * How many campaigns may hold this placement on the same day.
   *
   * This is the price of flat-rate selling. Under CPM an extra advertiser just
   * consumed their budget more slowly; under a day rate they dilute everyone
   * who already paid full price for that day. Capping the slot is what keeps
   * the promise honest, so it is enforced when a campaign is submitted and
   * again when it is approved — not merely displayed.
   */
  maxConcurrent: number;
  /** Where the reader actually sees it — shown on the pricing page. */
  surface: string;
};

export const AD_PLACEMENTS: Record<AdPlacement, PlacementConfig> = {
  sidebar: {
    id: "sidebar",
    name: "Sidebar",
    description:
      "A compact card in the right rail. Always visible while readers browse the feed.",
    dayRateCents: 200,
    maxConcurrent: 3,
    surface: "Feed right rail",
  },
  feed: {
    id: "feed",
    name: "In-feed",
    description:
      "A native card between posts in the main feed. Highest visibility placement.",
    dayRateCents: 400,
    maxConcurrent: 2,
    surface: "Between feed posts",
  },
  article: {
    id: "article",
    name: "In-article",
    description:
      "Inside the article body on post pages, where readers are most engaged.",
    dayRateCents: 500,
    maxConcurrent: 2,
    surface: "Post detail pages",
  },
};

export type DurationOption = {
  days: number;
  label: string;
  /** Whole-percent discount off the gross rate. */
  discountPercent: number;
  /** Shown on the option card when there is something worth shouting about. */
  note?: string;
};

/**
 * The booking lengths we promote.
 *
 * Longer bookings are discounted because they are worth more to us than the
 * revenue difference: a slot sold for 90 days is 90 days nobody has to sell.
 *
 * A custom length is still allowed — `discountForDays` grants the best tier a
 * length qualifies for, so booking 45 days is never worse than booking 30.
 */
export const AD_DURATIONS: DurationOption[] = [
  { days: 7, label: "1 week", discountPercent: 0 },
  { days: 14, label: "2 weeks", discountPercent: 5, note: "Save 5%" },
  { days: 30, label: "1 month", discountPercent: 15, note: "Most popular" },
  { days: 90, label: "3 months", discountPercent: 25, note: "Best value" },
];

/** Shortest bookable run. Anything less isn't worth a human review. */
export const MIN_CAMPAIGN_DAYS = 7;
/** Longest a single campaign may run. */
export const MAX_CAMPAIGN_DAYS = 180;
/** How far ahead a start date may be booked, in days. */
export const MAX_LEAD_DAYS = 365;

/** Creative copy limits — enforced on the server, mirrored in the form. */
export const AD_LIMITS = {
  headline: 60,
  body: 140,
  ctaLabel: 20,
  campaignName: 80,
  company: 100,
};

/** The discount a run of `days` earns: the best tier it qualifies for. */
export function discountForDays(days: number): number {
  let best = 0;
  for (const tier of AD_DURATIONS) {
    if (days >= tier.days && tier.discountPercent > best) {
      best = tier.discountPercent;
    }
  }
  return best;
}

export type Quote = {
  days: number;
  dayRateCents: number;
  discountPercent: number;
  /** Rate x days, before the length discount. */
  grossCents: number;
  /** What the advertiser actually pays. */
  priceCents: number;
  savingsCents: number;
};

/**
 * Price a booking. The single source of truth for what a campaign costs.
 *
 * The builder calls this to show a live total and the server calls it again to
 * decide what to charge — the client's number is never trusted, it is only
 * ever expected to MATCH. That is the whole reason this is one pure function
 * rather than the same arithmetic written out on both sides.
 */
export function quotePrice(placement: AdPlacement, days: number): Quote {
  const config = AD_PLACEMENTS[placement] ?? AD_PLACEMENTS.sidebar;
  const safeDays = Math.max(0, Math.floor(days) || 0);
  const dayRateCents = config.dayRateCents;
  const discountPercent = discountForDays(safeDays);
  const grossCents = dayRateCents * safeDays;
  // One rounding, at the end, over an integer product — so the stored price is
  // exact and re-quoting the same booking always returns the same number.
  const priceCents = Math.round((grossCents * (100 - discountPercent)) / 100);

  return {
    days: safeDays,
    dayRateCents,
    discountPercent,
    grossCents,
    priceCents,
    savingsCents: grossCents - priceCents,
  };
}

/** Cheapest possible booking — the "from" price in marketing copy. */
export function entryPriceCents(): number {
  return Math.min(
    ...Object.values(AD_PLACEMENTS).map(
      (p) => quotePrice(p.id, MIN_CAMPAIGN_DAYS).priceCents,
    ),
  );
}

/** UTC midnight of the day `at` falls on. Campaign days are whole UTC days. */
export function utcMidnight(at: Date | string | number): Date {
  const d = new Date(at);
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

/**
 * The exclusive end of a booking: midnight after the final day.
 *
 * Serving tests `startDate <= now < endDate`, so a 7-day run starting Monday
 * ends at midnight the following Monday and the last Sunday is delivered in
 * full. An inclusive end date would quietly sell six and a bit days as seven.
 */
export function endDateFor(startDate: Date, days: number): Date {
  return new Date(utcMidnight(startDate).getTime() + days * 86_400_000);
}

/** Whole days left in a run, floored at zero. */
export function daysRemaining(
  endDate: Date | string,
  now: Date = new Date(),
): number {
  const ms = new Date(endDate).getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

/** How many of a run's days have already been delivered. */
export function daysElapsed(
  startDate: Date | string,
  days: number,
  now: Date = new Date(),
): number {
  const ms = now.getTime() - new Date(startDate).getTime();
  return Math.min(days, Math.max(0, Math.floor(ms / 86_400_000)));
}

/** Format a cents integer as a display string, e.g. 12345 -> "$123.45". */
export function formatCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(Math.round(cents));
  return `${sign}$${(abs / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Same, but drops the ".00" on whole dollars — for dense rate-card copy. */
export function formatCentsShort(cents: number): string {
  const abs = Math.abs(Math.round(cents));
  return abs % 100 === 0
    ? `${cents < 0 ? "-" : ""}$${(abs / 100).toLocaleString()}`
    : formatCents(cents);
}
