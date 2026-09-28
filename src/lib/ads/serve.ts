import { createHash } from "crypto";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { getClientIp } from "@/lib/rateLimit";
import AdCampaign from "@/models/AdCampaign";
import Ad from "@/models/Ad";
import AdEvent from "@/models/AdEvent";
import AdDailyStat from "@/models/AdDailyStat";
import {
  AD_PLACEMENTS,
  endDateFor,
  utcMidnight,
  type AdPlacement,
} from "@/config/ads";

/** How long before the same viewer is counted again for the same creative. */
const IMPRESSION_DEDUP_MS = 60 * 60 * 1000; // 1 hour
const CLICK_DEDUP_MS = 24 * 60 * 60 * 1000; // 1 day

/**
 * Statuses that occupy a slot for flat-rate inventory purposes.
 *
 * `pending_review` counts: the advertiser has committed to those dates and we
 * are about to decide, so selling the same day to someone else and then
 * approving both is how a slot gets oversold. `paused` counts too — the days
 * were bought, and pausing stops delivery rather than releasing the booking.
 */
const SLOT_HOLDING_STATUSES = [
  "pending_review",
  "approved",
  "active",
  "paused",
] as const;

export type ServedAd = {
  id: string;
  campaignId: string;
  headline: string;
  body: string;
  imageUrl: string;
  ctaLabel: string;
  placement: AdPlacement;
};

/** UTC midnight for the day a stat belongs to. */
function dayKey(at: Date = new Date()): Date {
  return utcMidnight(at);
}

/**
 * Hash the viewer's identity before it is stored.
 *
 * Salted with NEXTAUTH_SECRET so the stored digests are not a rainbow-table of
 * the IP space: a leaked AdEvent collection reveals nothing about who saw what
 * without also leaking the app secret. Mirrors the post-view tracker.
 */
function hashViewer(input: string): string {
  return createHash("sha256")
    .update(`${input}:${process.env.NEXTAUTH_SECRET ?? ""}`)
    .digest("hex");
}

export function viewerIdentity(req: Request, userId?: string | null): string {
  return hashViewer(userId ? `u:${userId}` : `ip:${getClientIp(req)}`);
}

/**
 * The condition a campaign must meet to be shown to a reader.
 *
 * Every clause is a promise we sold:
 *  - `approved`/`active` only — nothing in review, rejected, or paused runs.
 *  - `paid` — we never serve inventory we have not been paid for.
 *  - inside the booked window. `endDate` is EXCLUSIVE (midnight after the last
 *    day), so the comparison is `$gt`, not `$gte` — using `$gte` would hand
 *    over a free extra moment on a day nobody bought.
 *
 * There is no budget clause any more. Under a flat day rate the campaign is
 * settled up front, so the only thing that can stop delivery is the calendar.
 */
function servableFilter(placement: AdPlacement, now: Date) {
  return {
    status: { $in: ["approved", "active"] },
    paymentStatus: "paid",
    placement,
    startDate: { $lte: now },
    endDate: { $gt: now },
  };
}

/**
 * Pick one creative to render in a placement, or null if nothing is eligible.
 *
 * Uses $sample for rotation. Under flat pricing this is what everyone who
 * bought the same day is actually paying for: an independent draw per request
 * gives each live campaign an even share of the slot over the day, with no
 * scheduler tracking who is owed what. The per-placement `maxConcurrent` cap
 * enforced at submit time is what keeps that share worth the money.
 */
export async function pickAd(
  placement: AdPlacement,
): Promise<ServedAd | null> {
  await connectToDatabase();
  const now = new Date();

  const rows = await AdCampaign.aggregate<{
    _id: Types.ObjectId;
    placement: AdPlacement;
    creative: {
      _id: Types.ObjectId;
      headline: string;
      body: string;
      imageUrl: string;
      ctaLabel: string;
    };
  }>([
    { $match: servableFilter(placement, now) },
    {
      $lookup: {
        from: "ads",
        let: { campaignId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$campaign", "$$campaignId"] },
              paused: { $ne: true },
            },
          },
          { $sample: { size: 1 } },
          { $project: { headline: 1, body: 1, imageUrl: 1, ctaLabel: 1 } },
        ],
        as: "creatives",
      },
    },
    // A campaign whose creatives are all paused must not win the draw and
    // leave the slot empty, so drop those before sampling.
    { $match: { "creatives.0": { $exists: true } } },
    { $sample: { size: 1 } },
    { $project: { placement: 1, creative: { $arrayElemAt: ["$creatives", 0] } } },
  ]);

  const row = rows[0];
  if (!row?.creative) return null;

  return {
    id: String(row.creative._id),
    campaignId: String(row._id),
    headline: row.creative.headline,
    body: row.creative.body ?? "",
    imageUrl: row.creative.imageUrl ?? "",
    ctaLabel: row.creative.ctaLabel || "Learn more",
    placement: row.placement,
  };
}

export type TrackResult =
  | { counted: false; reason: "duplicate" | "not_servable" }
  | { counted: true };

/**
 * Record an impression or click against a campaign's delivery numbers.
 *
 * No money moves here — that is the whole point of flat pricing, and it is why
 * this function lost its atomic budget guard, its partial-cent arithmetic, and
 * its "campaign exhausted" branch. What is left is reporting.
 *
 * Deduplication stays, and matters MORE than it did under CPM rather than
 * less. It used to protect the advertiser's wallet; now it protects the number
 * we show them. An impression count inflated by the same reader scrolling one
 * ad past their viewport twenty times is a vanity metric, and a flat-rate
 * advertiser deciding whether to renew deserves a figure closer to "people who
 * saw this" than "times this rendered".
 *
 * The dedup row is still reserved FIRST: the unique index rejecting the insert
 * IS the "already counted" signal, so two concurrent beacons cannot both get
 * through and double-count.
 */
export async function trackAdEvent(
  adId: string,
  type: "impression" | "click",
  req: Request,
  userId?: string | null,
): Promise<TrackResult> {
  if (!Types.ObjectId.isValid(adId)) return { counted: false, reason: "not_servable" };

  await connectToDatabase();
  const now = new Date();

  const ad = await Ad.findById(adId).select("campaign advertiser paused");
  if (!ad || ad.paused) return { counted: false, reason: "not_servable" };

  const campaign = await AdCampaign.findById(ad.campaign).select(
    "status paymentStatus startDate endDate",
  );
  if (!campaign) return { counted: false, reason: "not_servable" };

  // The same conditions servableFilter() applies, re-checked at count time so
  // a beacon fired from a stale page cannot credit a campaign that has since
  // ended, been paused, or been refunded.
  const live =
    (campaign.status === "active" || campaign.status === "approved") &&
    campaign.paymentStatus === "paid" &&
    campaign.startDate <= now &&
    campaign.endDate > now;
  if (!live) return { counted: false, reason: "not_servable" };

  // ── Dedup reservation ───────────────────────────────────────────────────
  const viewerHash = viewerIdentity(req, userId);
  const ttl = type === "click" ? CLICK_DEDUP_MS : IMPRESSION_DEDUP_MS;
  try {
    await AdEvent.create({
      ad: ad._id,
      type,
      viewerHash,
      expiresAt: new Date(now.getTime() + ttl),
    });
  } catch (err: any) {
    if (err?.code === 11000) return { counted: false, reason: "duplicate" };
    throw err;
  }

  // ── Roll up ─────────────────────────────────────────────────────────────
  const inc = type === "impression" ? { impressions: 1 } : { clicks: 1 };
  await Promise.all([
    AdCampaign.updateOne({ _id: campaign._id }, { $inc: inc }),
    Ad.updateOne({ _id: ad._id }, { $inc: inc }, { timestamps: false }),
    AdDailyStat.updateOne(
      { ad: ad._id, date: dayKey(now) },
      {
        $inc: inc,
        $setOnInsert: {
          campaign: campaign._id,
          advertiser: ad.advertiser,
        },
      },
      { upsert: true },
    ),
  ]);

  return { counted: true };
}

export type SlotAvailability = {
  placement: AdPlacement;
  /** How many campaigns may share this placement on one day. */
  capacity: number;
  /** The worst-case day in the requested window: the most campaigns booked. */
  taken: number;
  /** capacity - taken, floored at zero. */
  available: number;
  /** True when the whole requested window has room. */
  isAvailable: boolean;
};

/**
 * How full a placement is across a date window.
 *
 * Flat-rate selling needs this and CPM did not. Under CPM an extra advertiser
 * simply spent their budget more slowly; under a day rate, every campaign
 * added to a slot dilutes the share of everyone who already paid full price
 * for that day. So the slot has a hard capacity, and this is what enforces it.
 *
 * The count is the PEAK over the window, not the total: a booking overlapping
 * only the first day of a 90-day run still fills that day, and selling the
 * other 89 does not make it fair. Computing the peak means walking the
 * overlapping bookings and sweeping their start/end boundaries — cheap,
 * because only campaigns that overlap the window at all are loaded, and a
 * placement holds a handful of them by design.
 */
export async function getSlotAvailability(
  placement: AdPlacement,
  startDate: Date,
  endDate: Date,
  excludeCampaignId?: string | null,
): Promise<SlotAvailability> {
  await connectToDatabase();

  const capacity = AD_PLACEMENTS[placement]?.maxConcurrent ?? 1;

  const query: Record<string, unknown> = {
    placement,
    status: { $in: SLOT_HOLDING_STATUSES },
    // Half-open intervals overlap when each starts before the other ends.
    startDate: { $lt: endDate },
    endDate: { $gt: startDate },
  };
  // A campaign being resubmitted must not be counted as its own competitor.
  if (excludeCampaignId && Types.ObjectId.isValid(excludeCampaignId)) {
    query._id = { $ne: new Types.ObjectId(excludeCampaignId) };
  }

  const overlapping = await AdCampaign.find(query)
    .select("startDate endDate")
    .lean<{ startDate: Date; endDate: Date }[]>();

  // Sweep: +1 where a booking starts, -1 where it ends. The running maximum
  // is the busiest single day in the window.
  const boundaries: { at: number; delta: number }[] = [];
  for (const c of overlapping) {
    boundaries.push({ at: Math.max(+c.startDate, +startDate), delta: 1 });
    boundaries.push({ at: Math.min(+c.endDate, +endDate), delta: -1 });
  }
  // Ends before starts at the same instant: endDate is exclusive, so a booking
  // ending exactly when another begins hands the slot over rather than
  // overlapping it.
  boundaries.sort((a, b) => a.at - b.at || a.delta - b.delta);

  let running = 0;
  let taken = 0;
  for (const b of boundaries) {
    running += b.delta;
    if (running > taken) taken = running;
  }

  const available = Math.max(0, capacity - taken);
  return {
    placement,
    capacity,
    taken,
    available,
    isAvailable: available > 0,
  };
}

/**
 * Move the booked window to start today if the start date has already gone by.
 *
 * Time-based pricing makes this a fairness requirement rather than a nicety.
 * Someone who books seven days from Monday and is still waiting on review — or
 * on their own payment — until Wednesday has bought seven days and would
 * otherwise receive five. Anchoring the clock to the moment the campaign is
 * actually paid for means the advertiser always gets the full run they paid
 * for, and `days` stays the honest description of the booking.
 *
 * Mutates the document in place; the caller saves.
 */
export function startClockOnPayment(campaign: {
  startDate: Date;
  endDate: Date;
  days: number;
}): boolean {
  const today = utcMidnight(new Date());
  if (campaign.startDate >= today) return false;

  campaign.startDate = today;
  campaign.endDate = endDateFor(today, campaign.days);
  return true;
}

/**
 * Move campaigns through the time-driven parts of the workflow.
 *
 * Called by the cron route, and also opportunistically so the workflow stays
 * correct in a deployment with no scheduler configured:
 *   approved + paid + start date reached -> active
 *   active   + end date passed           -> completed
 *
 * A campaign now ends for exactly one reason: its last booked day is over.
 * Under CPM it could also die of budget exhaustion mid-run, which is the
 * ambiguity flat pricing removes.
 */
export async function syncCampaignSchedules(): Promise<{
  activated: number;
  completed: number;
}> {
  await connectToDatabase();
  const now = new Date();

  const [activated, completed] = await Promise.all([
    AdCampaign.updateMany(
      {
        status: "approved",
        paymentStatus: "paid",
        startDate: { $lte: now },
        endDate: { $gt: now },
      },
      { $set: { status: "active" } },
    ),
    AdCampaign.updateMany(
      // endDate is exclusive, so a campaign is done the moment now reaches it.
      { status: { $in: ["approved", "active"] }, endDate: { $lte: now } },
      { $set: { status: "completed" } },
    ),
  ]);

  return {
    activated: activated.modifiedCount ?? 0,
    completed: completed.modifiedCount ?? 0,
  };
}
