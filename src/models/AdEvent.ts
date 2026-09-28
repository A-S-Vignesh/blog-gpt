import { Schema, model, models, Document, Types } from "mongoose";

/**
 * Deduplication ledger for ad events — the same pattern PostView uses for post
 * views, and for the same reason: a reader who scrolls one ad back into view
 * twenty times has seen it once, and reporting it as twenty impressions to a
 * flat-rate advertiser weighing a renewal is just a lie with a number on it.
 *
 * A unique (ad, viewerHash, type) insert is attempted before anything is
 * counted. A duplicate-key error IS the "already counted" signal. Rows expire
 * on their own via TTL, so the same viewer becomes countable again after the
 * window — an hour for impressions, a day for clicks — and the collection
 * never grows without bound.
 */
export interface IAdEvent extends Document {
  ad: Types.ObjectId;
  type: "impression" | "click";
  /** sha256(userId or ip + salt) — never a raw IP. */
  viewerHash: string;
  expiresAt: Date;
}

const AdEventSchema = new Schema<IAdEvent>(
  {
    ad: { type: Schema.Types.ObjectId, ref: "Ad", required: true },
    type: { type: String, enum: ["impression", "click"], required: true },
    viewerHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: false },
);

AdEventSchema.index({ ad: 1, viewerHash: 1, type: 1 }, { unique: true });
AdEventSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const AdEvent = models.AdEvent || model<IAdEvent>("AdEvent", AdEventSchema);
export default AdEvent;
