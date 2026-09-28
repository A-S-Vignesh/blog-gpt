import { Schema, model, models, Document, Types } from "mongoose";

/**
 * One creative belonging to a campaign. Several can share a campaign's booked
 * slot, which is how an advertiser A/B-tests copy without paying twice — under
 * a flat day rate the extra variants cost them nothing at all.
 */
export interface IAd extends Document {
  _id: Types.ObjectId;
  campaign: Types.ObjectId;
  /** Denormalized from the campaign so ownership checks skip a join. */
  advertiser: Types.ObjectId;
  headline: string;
  body: string;
  imageUrl: string;
  imagePublicId?: string;
  destinationUrl: string;
  ctaLabel: string;
  /** Advertiser can pause one variant without pausing the campaign. */
  paused: boolean;
  impressions: number;
  clicks: number;
  createdAt: Date;
  updatedAt: Date;
}

const AdSchema = new Schema<IAd>(
  {
    campaign: {
      type: Schema.Types.ObjectId,
      ref: "AdCampaign",
      required: true,
      index: true,
    },
    advertiser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    headline: { type: String, required: true, trim: true, maxlength: 60 },
    body: { type: String, default: "", trim: true, maxlength: 140 },
    imageUrl: { type: String, default: "" },
    imagePublicId: { type: String, default: "" },
    // Validated as http(s) at the API layer before it ever gets here — a
    // javascript: or data: URL in this field would become a stored XSS the
    // moment it is rendered as an href.
    destinationUrl: { type: String, required: true, trim: true },
    ctaLabel: { type: String, default: "Learn more", trim: true, maxlength: 20 },
    paused: { type: Boolean, default: false },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const Ad = models.Ad || model<IAd>("Ad", AdSchema);
export default Ad;
