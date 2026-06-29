import { Schema, model, models, Document, Types } from "mongoose";

/**
 * One document per (identity, post, channel) — i.e. the same person sharing
 * the same post on the same channel only writes ONE Share row, ever.
 *
 * Counter inflation defense:
 *   - The unique compound index makes the second click a duplicate-key error
 *     so the counter isn't incremented twice.
 *   - This is the integrity gate; the rate limiter in the route is just for
 *     write-load protection.
 *
 * `identity` is a synthetic string so we can mix logged-in users and
 * anonymous visitors in the same uniqueness check:
 *   - `u:<userId>`  → logged-in (no expiry; this person's share is locked in)
 *   - `a:<sha256(ip|userAgent)>` → anonymous (best-effort; expires via TTL so
 *     the row is eventually cleaned up and CGNAT users aren't permanently
 *     blocked)
 */
export interface IShare extends Document {
  post: Types.ObjectId;
  identity: string;
  channel: string;
  expiresAt?: Date | null;
  createdAt: Date;
}

const ShareSchema = new Schema<IShare>(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
    identity: { type: String, required: true },
    channel: { type: String, required: true },
    // Only set for anonymous shares. Logged-in shares get null and never
    // expire — Mongo's TTL only deletes docs whose field is a Date.
    expiresAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Integrity gate — duplicate (identity, post, channel) writes throw E11000.
ShareSchema.index(
  { identity: 1, post: 1, channel: 1 },
  { unique: true },
);
// TTL — anonymous rows expire (`expiresAt` field is the trigger).
ShareSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Share = models.Share || model<IShare>("Share", ShareSchema);
export default Share;
