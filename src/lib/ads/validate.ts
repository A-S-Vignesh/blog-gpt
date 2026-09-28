import { ApiError } from "@/lib/api/errors";
import {
  AD_LIMITS,
  AD_PLACEMENTS,
  MAX_CAMPAIGN_DAYS,
  MAX_LEAD_DAYS,
  MIN_CAMPAIGN_DAYS,
  endDateFor,
  quotePrice,
  utcMidnight,
  type AdPlacement,
} from "@/config/ads";

/**
 * Accept only http(s) URLs, naming the field in every error message.
 *
 * This is the single most security-relevant validation in the ad system. A
 * creative's destinationUrl is rendered as an `href` on public pages, so a
 * `javascript:` URL would be stored XSS against every reader, and a `data:`
 * URL would let an advertiser serve arbitrary HTML from our origin's context.
 * Parsing with `new URL` and allowlisting the protocol closes both — a
 * substring check like `startsWith("http")` would not, since
 * `javascript:alert(1)//http` and similar tricks pass that test.
 *
 * A bare domain ("codolve.com") is upgraded to https:// rather than rejected.
 * People type URLs without the scheme constantly, and refusing them taught the
 * advertiser nothing except that some URL somewhere was wrong. The upgrade is
 * safe because the protocol is still checked AFTER parsing — a value that
 * already carries a scheme keeps it, so "javascript:..." is never rewritten
 * into something that passes.
 *
 * `label` names the field, because three different inputs share this function
 * and an error reading "destination URL" while the real problem was the
 * company website is worse than no message at all.
 */
export function parseUrlField(raw: unknown, label: string): string {
  if (typeof raw !== "string" || raw.trim().length === 0) {
    throw new ApiError("VALIDATION_FAILED", `${label} is required.`);
  }
  const value = raw.trim();
  if (value.length > 2000) {
    throw new ApiError("VALIDATION_FAILED", `That ${label.toLowerCase()} is too long.`);
  }

  // Only prepend a scheme when there is no scheme at all.
  //
  // The naive test — anything before a colon — misreads "example.com:8080" as
  // the scheme "example.com:", because RFC 3986 allows dots in scheme names.
  // Requiring the part before the colon to be DOT-FREE separates the two
  // reliably: real schemes we care about (http, https, javascript, data,
  // vbscript, file) contain no dot, while a bare "host:port" always does. A
  // dotted pseudo-scheme therefore falls through to the https:// upgrade and
  // is still protocol-checked below, so nothing dangerous slips past.
  const hasScheme = /^[a-zA-Z][a-zA-Z0-9+-]*:/.test(value);
  const candidate = hasScheme ? value : `https://${value}`;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new ApiError(
      "VALIDATION_FAILED",
      `${label} doesn't look like a valid web address. Example: https://example.com`,
    );
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ApiError(
      "VALIDATION_FAILED",
      `${label} must be a http:// or https:// address.`,
    );
  }
  // A scheme with no host ("https://") parses but is useless as a link.
  if (!url.hostname || !url.hostname.includes(".")) {
    throw new ApiError(
      "VALIDATION_FAILED",
      `${label} needs a full domain. Example: https://example.com`,
    );
  }
  return url.toString();
}

/** Back-compat alias — the creative's click-through target. */
export function parseDestinationUrl(raw: unknown): string {
  return parseUrlField(raw, "Destination URL");
}

function requireText(
  raw: unknown,
  field: string,
  max: number,
  { required = true }: { required?: boolean } = {},
): string {
  if (typeof raw !== "string") {
    if (!required) return "";
    throw new ApiError("VALIDATION_FAILED", `${field} is required.`);
  }
  const value = raw.trim();
  if (required && value.length === 0) {
    throw new ApiError("VALIDATION_FAILED", `${field} is required.`);
  }
  if (value.length > max) {
    throw new ApiError(
      "VALIDATION_FAILED",
      `${field} must be ${max} characters or fewer.`,
    );
  }
  return value;
}

export type CampaignInput = {
  name: string;
  company: string;
  contactEmail: string;
  website: string;
  placement: AdPlacement;
  days: number;
  dayRateCents: number;
  discountPercent: number;
  priceCents: number;
  startDate: Date;
  endDate: Date;
};

/**
 * Validate the campaign half of the builder form and PRICE it.
 *
 * Everything is checked server-side regardless of what the form enforces — the
 * form is a convenience, this is the contract.
 *
 * The price is the sharp edge here. The request carries a placement and a
 * number of days and NOTHING ELSE about money: no rate, no total, no discount.
 * All three are computed from the rate card by quotePrice(), so a crafted
 * request cannot book a 90-day article slot for a dollar. The end date is
 * derived the same way rather than accepted, which means the days someone pays
 * for and the days they are served can never disagree.
 */
export function parseCampaignInput(body: any): CampaignInput {
  const name = requireText(body?.name, "Campaign name", AD_LIMITS.campaignName);
  const company = requireText(body?.company, "Company", AD_LIMITS.company, {
    required: false,
  });
  const website = body?.website ? parseUrlField(body.website, "Company website") : "";

  const contactEmailRaw = requireText(body?.contactEmail, "Contact email", 200, {
    required: false,
  });
  if (contactEmailRaw && !/^\S+@\S+\.\S+$/.test(contactEmailRaw)) {
    throw new ApiError("VALIDATION_FAILED", "That contact email looks invalid.");
  }

  const placement = body?.placement;
  if (!placement || !(placement in AD_PLACEMENTS)) {
    throw new ApiError(
      "VALIDATION_FAILED",
      `Placement must be one of: ${Object.keys(AD_PLACEMENTS).join(", ")}.`,
    );
  }

  const days = Number(body?.days);
  if (!Number.isFinite(days) || !Number.isInteger(days)) {
    throw new ApiError(
      "VALIDATION_FAILED",
      "Choose how many days the campaign should run.",
    );
  }
  if (days < MIN_CAMPAIGN_DAYS) {
    throw new ApiError(
      "VALIDATION_FAILED",
      `The shortest booking is ${MIN_CAMPAIGN_DAYS} days.`,
    );
  }
  if (days > MAX_CAMPAIGN_DAYS) {
    throw new ApiError(
      "VALIDATION_FAILED",
      `A campaign can run for at most ${MAX_CAMPAIGN_DAYS} days. Book a second one to keep going.`,
    );
  }

  const rawStart = new Date(body?.startDate);
  if (Number.isNaN(rawStart.getTime())) {
    throw new ApiError("VALIDATION_FAILED", "Enter a valid start date.");
  }
  // Campaign days are whole UTC days, so the booking is snapped to a UTC
  // midnight here rather than starting mid-afternoon in whatever timezone the
  // browser happened to be in. Without this, "7 days" from a 16:00 start would
  // end at 16:00 and quietly clip the final day.
  const startDate = utcMidnight(rawStart);

  // One day of slack, because a browser west of UTC can legitimately submit a
  // "today" that is already yesterday in UTC. Anything older is a mistake.
  const floor = utcMidnight(Date.now() - 86_400_000);
  if (startDate < floor) {
    throw new ApiError(
      "VALIDATION_FAILED",
      "The start date can't be in the past.",
    );
  }
  const ceiling = utcMidnight(Date.now() + MAX_LEAD_DAYS * 86_400_000);
  if (startDate > ceiling) {
    throw new ApiError(
      "VALIDATION_FAILED",
      `You can book up to ${MAX_LEAD_DAYS} days ahead.`,
    );
  }

  // The rate card is the only source of money in this function — see the
  // note above parseCampaignInput.
  const quote = quotePrice(placement as AdPlacement, days);

  return {
    name,
    company,
    contactEmail: contactEmailRaw.toLowerCase(),
    website,
    placement: placement as AdPlacement,
    days,
    dayRateCents: quote.dayRateCents,
    discountPercent: quote.discountPercent,
    priceCents: quote.priceCents,
    startDate,
    endDate: endDateFor(startDate, days),
  };
}

export type CreativeInput = {
  headline: string;
  body: string;
  imageUrl: string;
  destinationUrl: string;
  ctaLabel: string;
};

export function parseCreativeInput(body: any): CreativeInput {
  return {
    headline: requireText(body?.headline, "Headline", AD_LIMITS.headline),
    body: requireText(body?.body, "Body text", AD_LIMITS.body, {
      required: false,
    }),
    // Image is optional and, when present, must be a real http(s) URL for the
    // same reason as the destination — it becomes an <img src> on public pages.
    imageUrl: body?.imageUrl ? parseUrlField(body.imageUrl, "Image URL") : "",
    destinationUrl: parseUrlField(body?.destinationUrl, "Destination URL"),
    ctaLabel:
      requireText(body?.ctaLabel, "Button label", AD_LIMITS.ctaLabel, {
        required: false,
      }) || "Learn more",
  };
}
