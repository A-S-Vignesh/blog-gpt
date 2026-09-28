import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import AdCampaign from "@/models/AdCampaign";
import Ad from "@/models/Ad";
import AdDailyStat from "@/models/AdDailyStat";
import { ApiError } from "@/lib/api/errors";
import type { AdPlacement } from "@/config/ads";

/**
 * Advertiser-facing queries.
 *
 * EVERY function here takes the caller's own userId and scopes its query by
 * it. That is the whole IDOR defence for this surface: there is no code path
 * that loads a campaign by id alone, so passing someone else's campaign id
 * returns "not found" rather than their data.
 */

/**
 * A day of delivery. No money in it — under flat pricing spend is not a daily
 * quantity, so a "spend per day" line would be an invented number.
 */
export type DailyPoint = {
  date: string;
  impressions: number;
  clicks: number;
};

export type CampaignRow = {
  _id: string;
  name: string;
  placement: AdPlacement;
  /** Booked length in days, and the flat price paid for it. */
  days: number;
  dayRateCents: number;
  discountPercent: number;
  priceCents: number;
  status: string;
  paymentStatus: string;
  impressions: number;
  clicks: number;
  startDate: string;
  /** Exclusive: midnight after the final booked day. */
  endDate: string;
  reviewNote: string;
  creativeCount: number;
  createdAt: string;
};

export type AdvertiserOverview = {
  totals: {
    campaigns: number;
    live: number;
    pendingReview: number;
    impressions: number;
    clicks: number;
    /** Settled: the sum of every booking actually paid for. */
    paidCents: number;
    /** Approved and waiting on payment — the advertiser's own to-do. */
    dueCents: number;
  };
  daily: DailyPoint[];
};

function dayKey(at: Date): Date {
  return new Date(
    Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()),
  );
}

/** Dense day series — days with no delivery still get a zero point, so the
 *  chart shows a real gap instead of silently connecting across it. */
function densify(
  rows: { _id: string; impressions: number; clicks: number }[],
  days: number,
): DailyPoint[] {
  const byDate = new Map(rows.map((r) => [r._id, r]));
  const out: DailyPoint[] = [];
  const today = dayKey(new Date());
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86_400_000);
    const key = d.toISOString().slice(0, 10);
    const row = byDate.get(key);
    out.push({
      date: key,
      impressions: row?.impressions ?? 0,
      clicks: row?.clicks ?? 0,
    });
  }
  return out;
}

const DAY_GROUP = {
  _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
  impressions: { $sum: "$impressions" },
  clicks: { $sum: "$clicks" },
};

export async function getAdvertiserOverview(
  userId: string,
  days = 30,
): Promise<AdvertiserOverview> {
  await connectToDatabase();
  const advertiser = new Types.ObjectId(userId);
  const since = new Date(dayKey(new Date()).getTime() - (days - 1) * 86_400_000);

  const [agg, statusCounts, daily] = await Promise.all([
    AdCampaign.aggregate<{
      _id: null;
      campaigns: number;
      impressions: number;
      clicks: number;
      paidCents: number;
      dueCents: number;
    }>([
      { $match: { advertiser, status: { $ne: "archived" } } },
      {
        $group: {
          _id: null,
          campaigns: { $sum: 1 },
          impressions: { $sum: "$impressions" },
          clicks: { $sum: "$clicks" },
          // Flat pricing makes both of these exact rather than estimated: a
          // booking is either settled or it is owed, with nothing in between
          // for partially-delivered budget to sit in.
          paidCents: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$priceCents", 0],
            },
          },
          dueCents: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$paymentStatus", "unpaid"] },
                    { $eq: ["$status", "approved"] },
                  ],
                },
                "$priceCents",
                0,
              ],
            },
          },
        },
      },
    ]),
    AdCampaign.aggregate<{ _id: string; count: number }>([
      { $match: { advertiser } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    AdDailyStat.aggregate<{
      _id: string;
      impressions: number;
      clicks: number;
    }>([
      { $match: { advertiser, date: { $gte: since } } },
      { $group: DAY_GROUP },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const byStatus = new Map(statusCounts.map((s) => [s._id, s.count]));
  const totals = agg[0];

  return {
    totals: {
      campaigns: totals?.campaigns ?? 0,
      live: (byStatus.get("active") ?? 0) + (byStatus.get("approved") ?? 0),
      pendingReview: byStatus.get("pending_review") ?? 0,
      impressions: totals?.impressions ?? 0,
      clicks: totals?.clicks ?? 0,
      paidCents: totals?.paidCents ?? 0,
      dueCents: totals?.dueCents ?? 0,
    },
    daily: densify(daily, days),
  };
}

export async function listMyCampaigns(
  userId: string,
  opts: { status?: string; skip?: number; limit?: number } = {},
): Promise<{ campaigns: CampaignRow[]; total: number; hasMore: boolean }> {
  await connectToDatabase();
  const advertiser = new Types.ObjectId(userId);

  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 50);
  const skip = Math.max(opts.skip ?? 0, 0);

  const query: Record<string, unknown> = { advertiser };
  if (opts.status) query.status = opts.status;

  const [docs, total] = await Promise.all([
    AdCampaign.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AdCampaign.countDocuments(query),
  ]);

  const ids = (docs as any[]).map((c) => c._id);
  const creativeCounts = new Map<string, number>();
  if (ids.length > 0) {
    const grouped = await Ad.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { campaign: { $in: ids } } },
      { $group: { _id: "$campaign", count: { $sum: 1 } } },
    ]);
    for (const g of grouped) creativeCounts.set(String(g._id), g.count);
  }

  const campaigns = (docs as any[]).map((c) => toCampaignRow(c, creativeCounts));
  return { campaigns, total, hasMore: skip + campaigns.length < total };
}

function toCampaignRow(
  c: any,
  creativeCounts?: Map<string, number>,
): CampaignRow {
  return {
    _id: String(c._id),
    name: c.name ?? "",
    placement: c.placement,
    days: c.days ?? 0,
    dayRateCents: c.dayRateCents ?? 0,
    discountPercent: c.discountPercent ?? 0,
    priceCents: c.priceCents ?? 0,
    status: c.status ?? "draft",
    paymentStatus: c.paymentStatus ?? "unpaid",
    impressions: c.impressions ?? 0,
    clicks: c.clicks ?? 0,
    startDate: new Date(c.startDate).toISOString(),
    endDate: new Date(c.endDate).toISOString(),
    reviewNote: c.reviewNote ?? "",
    creativeCount: creativeCounts?.get(String(c._id)) ?? 0,
    createdAt: new Date(c.createdAt ?? c._id.getTimestamp()).toISOString(),
  };
}

export type CreativeRow = {
  _id: string;
  headline: string;
  body: string;
  imageUrl: string;
  destinationUrl: string;
  ctaLabel: string;
  paused: boolean;
  impressions: number;
  clicks: number;
};

export type CampaignDetail = {
  campaign: CampaignRow & { company: string; website: string; contactEmail: string };
  creatives: CreativeRow[];
  daily: DailyPoint[];
};

/**
 * One campaign, scoped to its owner.
 *
 * `advertiser` is part of the query, not checked after the fact — so another
 * user's id simply does not match and they get a 404, learning nothing about
 * whether that campaign exists.
 */
export async function getCampaignDetail(
  userId: string,
  campaignId: string,
  days = 30,
): Promise<CampaignDetail> {
  if (!Types.ObjectId.isValid(campaignId)) {
    throw new ApiError("NOT_FOUND", "Campaign not found.");
  }
  await connectToDatabase();

  const advertiser = new Types.ObjectId(userId);
  const campaign = await AdCampaign.findOne({
    _id: campaignId,
    advertiser,
  }).lean<any>();
  if (!campaign) throw new ApiError("NOT_FOUND", "Campaign not found.");

  const since = new Date(dayKey(new Date()).getTime() - (days - 1) * 86_400_000);
  const [creatives, daily] = await Promise.all([
    Ad.find({ campaign: campaign._id }).sort({ createdAt: 1 }).lean(),
    AdDailyStat.aggregate<{
      _id: string;
      impressions: number;
      clicks: number;
    }>([
      { $match: { campaign: campaign._id, date: { $gte: since } } },
      { $group: DAY_GROUP },
      { $sort: { _id: 1 } },
    ]),
  ]);

  return {
    campaign: {
      ...toCampaignRow(campaign),
      creativeCount: creatives.length,
      company: campaign.company ?? "",
      website: campaign.website ?? "",
      contactEmail: campaign.contactEmail ?? "",
    },
    creatives: (creatives as any[]).map((a) => ({
      _id: String(a._id),
      headline: a.headline ?? "",
      body: a.body ?? "",
      imageUrl: a.imageUrl ?? "",
      destinationUrl: a.destinationUrl ?? "",
      ctaLabel: a.ctaLabel ?? "Learn more",
      paused: Boolean(a.paused),
      impressions: a.impressions ?? 0,
      clicks: a.clicks ?? 0,
    })),
    daily: densify(daily, days),
  };
}
