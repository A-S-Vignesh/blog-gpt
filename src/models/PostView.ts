import { Schema, model, models, Document, Types } from "mongoose";

export interface IPostView extends Document {
  postId: Types.ObjectId;
  /** Hashed viewer identity: sha256(userId or ip). */
  viewerHash: string;
  expiresAt: Date;
}

const PostViewSchema = new Schema<IPostView>(
  {
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    viewerHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: false },
);

// Unique (postId, viewerHash) — the second insert in the window will throw a
// duplicate-key error, which we use as the dedup signal.
PostViewSchema.index({ postId: 1, viewerHash: 1 }, { unique: true });

// TTL: docs auto-delete after `expiresAt` so the same viewer can count again
// after the dedup window.
PostViewSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const PostView =
  models.PostView || model<IPostView>("PostView", PostViewSchema);
export default PostView;
