import { Schema, model, models, Document, Types } from "mongoose";
import type { PlanId } from "@/config/plans";

export type SubscriptionStatus =
  | "created"
  | "authenticated"
  | "active"
  | "paused"
  | "halted"
  | "past_due"
  | "canceled"
  | "expired";

export interface ISubscription extends Document {
  user: Types.ObjectId;
  /** Razorpay subscription id (sub_xxx). Unique. */
  providerSubscriptionId: string;
  /** Razorpay plan id (plan_xxx). */
  providerPlanId: string;
  /** Razorpay customer id (cust_xxx) if we created one. Optional. */
  providerCustomerId?: string;
  plan: PlanId;
  billingCycle: "monthly" | "yearly";
  status: SubscriptionStatus;
  amount: number;
  currency: string;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  canceledAt?: Date | null;
  /** When access actually ends after a cancellation. */
  endsAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    providerSubscriptionId: {
      type: String,
      required: true,
      unique: true,
    },
    providerPlanId: { type: String, required: true },
    providerCustomerId: { type: String, default: "" },
    plan: {
      type: String,
      enum: ["free", "pro", "business"],
      required: true,
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "yearly"],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "created",
        "authenticated",
        "active",
        "paused",
        "halted",
        "past_due",
        "canceled",
        "expired",
      ],
      default: "created",
      index: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    currentPeriodStart: { type: Date, default: null },
    currentPeriodEnd: { type: Date, default: null },
    canceledAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const Subscription =
  models.Subscription ||
  model<ISubscription>("Subscription", SubscriptionSchema);
