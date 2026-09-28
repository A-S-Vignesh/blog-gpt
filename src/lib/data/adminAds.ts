import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/admin/guard";
import AdCampaign from "@/models/AdCampaign";
import Ad from "@/models/Ad";
import AdDailyStat from "@/models/AdDailyStat";
import type { DailyPoint } from "@/lib/data/ads";

/**
 * Admin-side ad queries — our revenue, not the advertiser's performance.
 *
 * Like src/lib/data/admin.ts, every exported function starts with
 * requireAdmin(). The gate lives in the data layer rather than in the page,
 * because a layout or page check can be skipped by a crafted RSC request while
 * this cannot. requireAdmin() is memoized per request, so the repetition is
 * free.
 */

function dayKey(at: Date): Date {
  return new Date(
    Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()),
  );
}

/** A day on the admin chart: what we delivered, and what we banked. */
export type AdminDailyPoint = DailyPoint & { revenueCents: number };

/**
 * Dense day series, merging two independent sources.
 *
 * Delivery and revenue no longer share a timeline. Under CPM they did — every
 * impression was a fraction of a cent, so one AdDailyStat row carried both.
 * A flat booking is banked once, on the day it is paid for, and then delivers
 * for weeks afterwards. Charting them together is still useful (it shows sales
 * against what those sales are obliged to deliver), but they have to be
 * gathered separately and lined up by date, which is what this does.
 */
function densify(
  delivery: { _id: string; impressions: number; clicks: number }[],
  revenue: { _id: string; revenueCents: number }[],
  days: number,
): AdminDailyPoint[] {
  const byDate = new Map(delivery.map((r) => [r._id, r]));
  const revenueByDate = new Map(revenue.map((r) => [r._id, r.revenueCents]));
  const out: AdminDailyPoint[] = [];
  const today = dayKey(new Date());
  for (let i = days - 1; i >= 0; i--) {
    const key = new Date(today.getTime() - i * 86_400_000)
      .toISOString()
      .slice(0, 10);
    const row = byDate.get(key);
    out.push({
      date: key,
      impressions: row?.impressions ?? 0,
      clicks: row?.clicks ?? 0,
      revenueCents: revenueByDate.get(key) ?? 0,
    });
  }
  return out;
}

export type TopAdvertiser = {
  advertiserId: string;
  name: string;
  email: string;
  username: string;
  /** Lifetime money actually collected from this advertiser. */
  paidCents: number;
  campaigns: number;
};

export type AdRevenueOverview = {
  totals: {
    /** Money collected: every booking that has actually been paid for. */
    revenueCents: number;
    revenueThisMonthCents: number;
    /** Approved, invoiced to the advertiser, not yet paid. */
    awaitingPaymentCents: number;
    /** Days of inventory currently sold and running. */
    bookedDaysRunning: number;
    pendingReview: number;
    liveCampaigns: number;
    totalCampaigns: number;
    advertisers: number;
    impressions: number;
    clicks: number;
  };
  daily: AdminDailyPoint[];
  topAdvertisers: TopAdvertiser[];
};

export async function getAdRevenueOverview(
  days = 30,
): Promise<AdRevenueOverview> {
  await requireAdmin();
  await connectToDatabase();

  const since = new Date(dayKey(new Date()).getTime() - (days - 1) * 86_400_000);
  const monthStart = new Date(
    Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1),
  );

  const now = new Date();

  const [
    totalsAgg,
    monthAgg,
    statusCounts,
    advertiserCount,
    daily,
    dailyRevenue,
    runningAgg,
    top,
  ] = await Promise.all([
    AdCampaign.aggregate<{
      _id: null;
      revenueCents: number;
      awaitingPaymentCents: number;
      impressions: number;
      clicks: number;
      campaigns: number;
    }>([
      {
        $group: {
          _id: null,
          // Flat pricing means revenue is simply what has been paid. There is
          // no accrual to reconcile and no "unserved budget" hanging over us —
          // the obligation a paid booking creates is measured in days, not
          // dollars, so it is counted as bookedDaysRunning below instead.
          revenueCents: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$priceCents", 0],
            },
          },
          awaitingPaymentCents: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "approved"] },
                    { $eq: ["$paymentStatus", "unpaid"] },
                  ],
                },
                "$priceCents",
                0,
              ],
            },
          },
          impressions: { $sum: "$impressions" },
          clicks: { $sum: "$clicks" },
          campaigns: { $sum: 1 },
        },
      },
    ]),
    AdCampaign.aggregate<{ _id: null; revenueCents: number }>([
      { $match: { paymentStatus: "paid", paidAt: { $gte: monthStart } } },
      { $group: { _id: null, revenueCents: { $sum: "$priceCents" } } },
    ]),
    AdCampaign.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    AdCampaign.distinct("advertiser").then((ids) => ids.length),
    AdDailyStat.aggregate<{
      _id: string;
      impressions: number;
      clicks: number;
    }>([
      { $match: { date: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          impressions: { $sum: "$impressions" },
          clicks: { $sum: "$clicks" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    // Revenue by the day it was collected — the sales line, which under flat
    // pricing spikes on payment days rather than tracking traffic.
    AdCampaign.aggregate<{ _id: string; revenueCents: number }>([
      { $match: { paymentStatus: "paid", paidAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$paidAt" } },
          revenueCents: { $sum: "$priceCents" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    // Inventory currently sold: days still to run on live bookings.
    AdCampaign.aggregate<{ _id: null; bookedDays: number }>([
      {
        $match: {
          status: { $in: ["approved", "active"] },
          paymentStatus: "paid",
          endDate: { $gt: now },
        },
      },
      { $group: { _id: null, bookedDays: { $sum: "$days" } } },
    ]),
    AdCampaign.aggregate<{
      _id: Types.ObjectId;
      paidCents: number;
      campaigns: number;
      user: { name: string; email: string; username: string }[];
    }>([
      {
        $group: {
          _id: "$advertiser",
          paidCents: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$priceCents", 0],
            },
          },
          campaigns: { $sum: 1 },
        },
      },
      { $sort: { paidCents: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
          pipeline: [{ $project: { name: 1, email: 1, username: 1 } }],
        },
      },
    ]),
  ]);

  const byStatus = new Map(statusCounts.map((s) => [s._id, s.count]));
  const t = totalsAgg[0];

  return {
    totals: {
      revenueCents: t?.revenueCents ?? 0,
      revenueThisMonthCents: monthAgg[0]?.revenueCents ?? 0,
      awaitingPaymentCents: t?.awaitingPaymentCents ?? 0,
      bookedDaysRunning: runningAgg[0]?.bookedDays ?? 0,
      pendingReview: byStatus.get("pending_review") ?? 0,
      liveCampaigns:
        (byStatus.get("active") ?? 0) + (byStatus.get("approved") ?? 0),
      totalCampaigns: t?.campaigns ?? 0,
      advertisers: advertiserCount,
      impressions: t?.impressions ?? 0,
      clicks: t?.clicks ?? 0,
    },
    daily: densify(daily, dailyRevenue, days),
    topAdvertisers: top.map((row) => ({
      advertiserId: String(row._id),
      name: row.user?.[0]?.name ?? "(deleted user)",
      email: row.user?.[0]?.email ?? "",
      username: row.user?.[0]?.username ?? "",
      paidCents: row.paidCents ?? 0,
      campaigns: row.campaigns,
    })),
  };
}

export type AdminCampaignRow = {
  _id: string;
  name: string;
  company: string;
  website: string;
  contactEmail: string;
  placement: string;
  days: number;
  dayRateCents: number;
  discountPercent: number;
  priceCents: number;
  status: string;
  paymentStatus: string;
  impressions: number;
  clicks: number;
  startDate: string;
  endDate: string;
  reviewNote: string;
  submittedAt: string | null;
  createdAt: string;
  advertiser: { id: string; name: string; email: string; username: string } | null;
  creatives: {
    _id: string;
    headline: string;
    body: string;
    imageUrl: string;
    destinationUrl: string;
    ctaLabel: string;
  }[];
};

export async function listAdminCampaigns(
  opts: { status?: string; skip?: number; limit?: number } = {},
): Promise<{ campaigns: AdminCampaignRow[]; total: number; hasMore: boolean }> {
  await requireAdmin();
  await connectToDatabase();

  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 50);
  const skip = Math.max(opts.skip ?? 0, 0);

  const query: Record<string, unknown> = {};
  if (opts.status) query.status = opts.status;

  const [docs, total] = await Promise.all([
    AdCampaign.find(query)
      .populate("advertiser", "name email username")
      // Review queue first: oldest submission at the top of a pending filter,
      // newest-first otherwise.
      .sort(opts.status === "pending_review" ? { submittedAt: 1 } : { createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AdCampaign.countDocuments(query),
  ]);

  const ids = (docs as any[]).map((c) => c._id);
  const creativesByCampaign = new Map<string, any[]>();
  if (ids.length > 0) {
    const creatives = await Ad.find({ campaign: { $in: ids } })
      .select("campaign headline body imageUrl destinationUrl ctaLabel")
      .lean();
    for (const c of creatives as any[]) {
      const key = String(c.campaign);
      if (!creativesByCampaign.has(key)) creativesByCampaign.set(key, []);
      creativesByCampaign.get(key)!.push(c);
    }
  }

  const campaigns: AdminCampaignRow[] = (docs as any[]).map((c) => ({
    _id: String(c._id),
    name: c.name ?? "",
    company: c.company ?? "",
    website: c.website ?? "",
    contactEmail: c.contactEmail ?? "",
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
    submittedAt: c.submittedAt ? new Date(c.submittedAt).toISOString() : null,
    createdAt: new Date(c.createdAt ?? c._id.getTimestamp()).toISOString(),
    advertiser: c.advertiser
      ? {
          id: String(c.advertiser._id),
          name: c.advertiser.name ?? "",
          email: c.advertiser.email ?? "",
          username: c.advertiser.username ?? "",
        }
      : null,
    creatives: (creativesByCampaign.get(String(c._id)) ?? []).map((a) => ({
      _id: String(a._id),
      headline: a.headline ?? "",
      body: a.body ?? "",
      imageUrl: a.imageUrl ?? "",
      destinationUrl: a.destinationUrl ?? "",
      ctaLabel: a.ctaLabel ?? "Learn more",
    })),
  }));

  return { campaigns, total, hasMore: skip + campaigns.length < total };
}

/** Sidebar badge: campaigns waiting on a review decision. */
export async function getPendingAdCount(): Promise<number> {
  await requireAdmin();
  await connectToDatabase();
  return AdCampaign.countDocuments({ status: "pending_review" });
}
