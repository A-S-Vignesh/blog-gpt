import { Schema, model, models, Document, Types } from "mongoose";

/**
 * `follower` follows `following`. One doc per relationship.
 */
export interface IFollow extends Document {
  follower: Types.ObjectId;
  following: Types.ObjectId;
  createdAt: Date;
}

const FollowSchema = new Schema<IFollow>(
  {
    follower: { type: Schema.Types.ObjectId, ref: "User", required: true },
    following: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Cannot follow same user twice.
FollowSchema.index({ follower: 1, following: 1 }, { unique: true });
// Fast "who follows X" + "who does X follow" lookups.
FollowSchema.index({ following: 1, createdAt: -1 });
FollowSchema.index({ follower: 1, createdAt: -1 });

const Follow = models.Follow || model<IFollow>("Follow", FollowSchema);
export default Follow;
