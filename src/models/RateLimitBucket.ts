import { Schema, model, models, Document } from "mongoose";

export interface IRateLimitBucket extends Document {
  key: string;
  windowStart: Date;
  count: number;
  expiresAt: Date;
}

const RateLimitBucketSchema = new Schema<IRateLimitBucket>(
  {
    key: { type: String, required: true },
    windowStart: { type: Date, required: true },
    count: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: false },
);

// Unique compound index so each (key, window) maps to one doc
RateLimitBucketSchema.index({ key: 1, windowStart: 1 }, { unique: true });

// TTL index: docs auto-delete after expiresAt passes
RateLimitBucketSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RateLimitBucket =
  models.RateLimitBucket ||
  model<IRateLimitBucket>("RateLimitBucket", RateLimitBucketSchema);

export default RateLimitBucket;
