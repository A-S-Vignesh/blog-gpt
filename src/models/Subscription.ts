import { Schema, model, models, Document } from "mongoose";

export interface ISubscription extends Document {
  user: Schema.Types.ObjectId;
  customerId: string;
  subscriptionId: string;
  plan: string;
  status: "active" | "canceled" | "past_due" | "trialing";
  amount: number;
  currency: string;
  paymentMethod: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  lastPaymentDate: Date;
  nextPaymentDate: Date;
  trial: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    customerId: { type: String, required: true },
    subscriptionId: { type: String, required: true },
    plan: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "canceled", "past_due", "trialing"],
      default: "trialing",
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    paymentMethod: { type: String, default: "" },
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    lastPaymentDate: Date,
    nextPaymentDate: Date,
    trial: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Subscription =
  models.Subscription ||
  model<ISubscription>("Subscription", SubscriptionSchema);
