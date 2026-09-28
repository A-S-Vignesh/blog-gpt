import { Schema, model, models, Document, Types } from "mongoose";
import type { AdPlacement } from "@/config/ads";

/**
 * An advertiser's campaign — the unit that carries the booking, the schedule,
 * and the review decision. Creatives live in the `Ad` collection and point
 * back here, so one campaign can run several variants in the same slot.
 *
 * Pricing is FLAT and time-based: a placement is booked for `days` days at the
 * `dayRateCents` in force when it was created, and `priceCents` is the one
 * amount ever charged. The rate is copied onto the campaign rather than read
 * from the rate card at display time, so raising prices next month never
 * silently rewrites what someone already agreed to pay.
 *
 * Status is a deliberate workflow, not a free-form string:
 *
 *   draft ──submit──> pending_review ──approve──> approved ──(start date)──> active
 *                            │                          │  ▲                    │
 *                            └────reject────> rejected  │  │                (end date
 *                                                  pause│  │resume            passes)
 *                                                       ▼  │                     │
 *                                                     paused                      ▼
 *                                                                            completed
 *
 * Only `active`/`approved` campaigns are ever served, and only while paid and
 * inside their date window — see servableFilter() in src/lib/ads/serve.ts.
 */
export type CampaignStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "active"
  | "paused"
  | "completed"
  | "archived";

export type PaymentStatus = "unpaid" | "paid" | "refunded";

export interface IAdCampaign extends Document {
  _id: Types.ObjectId;
  advertiser: Types.ObjectId;
  name: string;
  company: string;
  contactEmail: string;
  website: string;
  placement: AdPlacement;
  /** Length of the booking in whole days. */
  days: number;
  /** Rate card price per day, in cents, locked in when the campaign was made. */
  dayRateCents: number;
  /** Length discount applied, as whole percent. */
  discountPercent: number;
  /** The single amount charged, in integer cents. days x rate, less discount. */
  priceCents: number;
  /** Inclusive start (UTC midnight) and EXCLUSIVE end — see endDateFor(). */
  startDate: Date;
  endDate: Date;
  status: CampaignStatus;
  paymentStatus: PaymentStatus;
  /** Razorpay order/payment ids from the up-front charge. */
  paymentOrderId?: string;
  paymentId?: string;
  paidAt?: Date | null;
  /** Reviewer decision trail. */
  reviewNote?: string;
  reviewedBy?: Types.ObjectId | null;
  reviewedAt?: Date | null;
  submittedAt?: Date | null;
  /**
   * Denormalized lifetime delivery. Reporting only — nothing here affects
   * billing, which is settled the moment the campaign is paid for.
   */
  impressions: number;
  clicks: number;
  createdAt: Date;
  updatedAt: Date;
}

const AdCampaignSchema = new Schema<IAdCampaign>(
  {
    advertiser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    company: { type: String, default: "", trim: true, maxlength: 100 },
    contactEmail: { type: String, default: "", trim: true, lowercase: true },
    website: { type: String, default: "", trim: true },
    placement: {
      type: String,
      enum: ["sidebar", "feed", "article"],
      required: true,
    },
    days: { type: Number, required: true, min: 1 },
    dayRateCents: { type: Number, required: true, min: 0 },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    priceCents: { type: Number, required: true, min: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: [
        "draft",
        "pending_review",
        "approved",
        "rejected",
        "active",
        "paused",
        "completed",
        "archived",
      ],
      default: "draft",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
      index: true,
    },
    paymentOrderId: { type: String, default: "" },
    paymentId: { type: String, default: "" },
    paidAt: { type: Date, default: null },
    reviewNote: { type: String, default: "", maxlength: 500 },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    submittedAt: { type: Date, default: null },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// An advertiser's own campaign list, newest first.
AdCampaignSchema.index({ advertiser: 1, createdAt: -1 });
// The admin review queue.
AdCampaignSchema.index({ status: 1, submittedAt: -1 });
// The serving query, and the slot-availability count that guards flat-rate
// inventory — both filter on exactly these fields.
AdCampaignSchema.index({ placement: 1, status: 1, startDate: 1, endDate: 1 });
// Revenue-by-day on the admin dashboard: flat pricing recognises revenue on
// the day a campaign was paid for, so paidAt is the axis it groups by.
AdCampaignSchema.index({ paymentStatus: 1, paidAt: 1 });

const AdCampaign =
  models.AdCampaign || model<IAdCampaign>("AdCampaign", AdCampaignSchema);
export default AdCampaign;
