import { Schema, model, models, Document, Types } from "mongoose";

/**
 * Idempotency log for incoming Razorpay webhook events.
 * Storing the raw event lets us replay or audit if anything goes wrong.
 */
export interface IPaymentEvent extends Document {
  /** Razorpay's unique event identifier. */
  providerEventId: string;
  /** e.g. "subscription.activated", "payment.failed". */
  eventType: string;
  user?: Types.ObjectId | null;
  subscription?: Types.ObjectId | null;
  payload: Record<string, unknown>;
  processedAt: Date;
}

const PaymentEventSchema = new Schema<IPaymentEvent>(
  {
    providerEventId: { type: String, required: true, unique: true },
    eventType: { type: String, required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", default: null },
    subscription: {
      type: Schema.Types.ObjectId,
      ref: "Subscription",
      default: null,
    },
    payload: { type: Schema.Types.Mixed, required: true },
    processedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: false },
);

const PaymentEvent =
  models.PaymentEvent ||
  model<IPaymentEvent>("PaymentEvent", PaymentEventSchema);
export default PaymentEvent;
