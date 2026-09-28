import { Schema, model, models, Document, Types } from "mongoose";

/**
 * Per-ad, per-day rollup. This is the source of truth for the delivery charts
 * on both dashboards; the lifetime counters on Ad and AdCampaign are
 * denormalized conveniences derived from the same writes.
 *
 * There is no money in here. Under flat day-rate pricing a campaign is paid
 * for in one up-front charge, so revenue is recognised against the campaign's
 * paidAt date rather than accrued per event. What this collection answers is
 * the only question delivery data should answer now: what did the advertiser
 * actually get for their booking?
 *
 * Rolling up as events arrive (rather than storing one row per impression and
 * aggregating at read time) keeps the collection proportional to
 * ads x days instead of ads x views, so the advertiser dashboard stays fast
 * no matter how much traffic a campaign gets.
 */
export interface IAdDailyStat extends Document {
  ad: Types.ObjectId;
  campaign: Types.ObjectId;
  advertiser: Types.ObjectId;
  /** UTC midnight of the day being counted. */
  date: Date;
  impressions: number;
  clicks: number;
}

const AdDailyStatSchema = new Schema<IAdDailyStat>(
  {
    ad: { type: Schema.Types.ObjectId, ref: "Ad", required: true },
    campaign: {
      type: Schema.Types.ObjectId,
      ref: "AdCampaign",
      required: true,
    },
    advertiser: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
  },
  { timestamps: false },
);

// The upsert target for every tracked event.
AdDailyStatSchema.index({ ad: 1, date: 1 }, { unique: true });
// Campaign timeline chart.
AdDailyStatSchema.index({ campaign: 1, date: 1 });
// Advertiser-wide chart, and the admin delivery-by-day query.
AdDailyStatSchema.index({ advertiser: 1, date: 1 });
AdDailyStatSchema.index({ date: 1 });

const AdDailyStat =
  models.AdDailyStat ||
  model<IAdDailyStat>("AdDailyStat", AdDailyStatSchema);
export default AdDailyStat;
