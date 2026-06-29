import { Schema, model, models, Document, Types } from "mongoose";

/**
 * One document per (user, post) like.
 * Replaces the embedded `likes: ObjectId[]` array on Post — that pattern
 * fails at scale (16MB doc cap, slow array updates, full-doc rewrites).
 */
export interface ILike extends Document {
  user: Types.ObjectId;
  post: Types.ObjectId;
  createdAt: Date;
}

const LikeSchema = new Schema<ILike>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Unique compound index → idempotent "create like" by attempting insert;
// duplicate-key error is the toggle-off signal.
LikeSchema.index({ user: 1, post: 1 }, { unique: true });
// Fast "all likes by post" / "all likes by user" lookups.
LikeSchema.index({ post: 1, createdAt: -1 });
LikeSchema.index({ user: 1, createdAt: -1 });

const Like = models.Like || model<ILike>("Like", LikeSchema);
export default Like;
