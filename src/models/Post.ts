import { Schema, model, models, Document } from "mongoose";

export interface IPost extends Document {
  creator: Schema.Types.ObjectId;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  image: string;
  imagePublicId?: string;
  tags: string[];
  category?: string;
  status?: "draft" | "published" | "archived";
  moderationStatus?: "pending" | "approved" | "flagged";
  moderationReason?: string;
  moderationCategories?: string[];
  moderationCheckedAt?: Date;
  views?: number;
  /** Denormalized counter — source of truth is the Like collection. */
  likesCount?: number;
  /** Denormalized counter — source of truth is the Comment collection. */
  commentsCount?: number;
  /** Post owner can disable new comments. Undefined on legacy posts == allowed. */
  allowComments?: boolean;
  /** Denormalized counter — source of truth is the Bookmark collection. */
  bookmarksCount?: number;
  /** Total share clicks across all channels (tracked best-effort, no source of truth). */
  sharesCount?: number;
  /** Per-channel share tally: { twitter: 12, whatsapp: 4, ... }. */
  sharesByChannel?: Record<string, number>;
  readingTime?: number;
  metaTitle?: string;
  metaDescription?: string;
  scheduledAt?: Date;
  date?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const PostSchema = new Schema<IPost>(
  {
    creator: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    slug: { type: String, required: true },
    excerpt: { type: String, default: "" },
    content: { type: String, required: true },
    image: {
      type: String,
      default:
        "https://res.cloudinary.com/ddj4zaxln/image/upload/laptop_hyujfu.png",
    },
    imagePublicId: { type: String, default: "" },
    tags: { type: [String], default: [] },
    category: { type: String },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    moderationStatus: {
      type: String,
      enum: ["pending", "approved", "flagged"],
      default: "pending",
      index: true,
    },
    moderationReason: { type: String, default: "" },
    moderationCategories: { type: [String], default: [] },
    moderationCheckedAt: { type: Date },
    views: { type: Number, default: 0 },
    likesCount: { type: Number, default: 0, index: true },
    commentsCount: { type: Number, default: 0 },
    allowComments: { type: Boolean, default: true },
    bookmarksCount: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 },
    sharesByChannel: { type: Map, of: Number, default: () => new Map() },
    readingTime: { type: Number, default: 0 },
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    scheduledAt: { type: Date },
    date: { type: Date },
  },
  { timestamps: true }
);

PostSchema.index({ creator: 1, slug: 1 }, { unique: true });
PostSchema.index({ status: 1 });
// Feed/listing by status, newest-first.
PostSchema.index({ status: 1, createdAt: -1 });
// A creator's posts filtered by status (e.g. their drafts/published).
PostSchema.index({ creator: 1, status: 1 });
// Public Explore/search feed: newest-PUBLISHED first, with _id as a stable
// tiebreaker. Backs the `.sort({ date: -1, _id: -1 })` listing queries so the
// sort stays index-covered (no in-memory sort) as the collection grows. We sort
// by `date` (publish time), never `updatedAt`, so edits/likes can't reshuffle
// the feed.
PostSchema.index({ date: -1, _id: -1 });
// A creator's posts, newest-published first — backs the profile feed sort.
PostSchema.index({ creator: 1, date: -1, _id: -1 });

const Post = models.Post || model<IPost>("Post", PostSchema);
export default Post;
