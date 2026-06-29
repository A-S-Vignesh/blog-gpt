import { model, models, Schema,Types, Document, Model } from "mongoose";

export type PlanId = "free" | "pro" | "business";

/**
 * Build a format validator that only runs when the field is actually being set
 * or changed. On an existing document where we only touched unrelated fields
 * (e.g. an AI-usage counter, plan status, or deletion flag), the field's format
 * is NOT re-checked — so a legacy/edge-case value (a short legacy username, or
 * an accented OAuth name) can't block those unrelated saves with a 500. New
 * accounts and explicit profile edits still validate normally, and query-level
 * updates (where `this` is the query, not a document) fall through to the regex.
 */
function validateFormatWhenModified(field: string, re: RegExp) {
  return function (this: unknown, value: string): boolean {
    const doc = this as { isModified?: (path: string) => boolean };
    if (typeof doc?.isModified === "function" && !doc.isModified(field)) {
      return true;
    }
    return re.test(value);
  };
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  name: string;
  username: string;
  /**
   * The user's prior handle, kept after their ONE-TIME username change so old
   * /{username} and /{username}/{slug} links 301-redirect to the new handle,
   * and so the retired handle is never reassigned to someone else. Absent until
   * a change is made.
   */
  previousUsername?: string;
  /** Set the moment the one-time username change is used; presence = locked. */
  usernameChangedAt?: Date | null;
  bio?: string;
  socials: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
  website?: string;
  image?: string;
  role: "admin" | "author" | "user";
  emailVerified: boolean;
  isActive: boolean;
  followersCount: number;
  followingCount: number;
  bookmarksCount: number;
  geminiApiKey?: string;
  slug?: string;
  plan: PlanId;
  planStatus: "active" | "past_due" | "canceled";
  planRenewsAt?: Date | null;
  aiGenerationCount: number;
  aiUsagePeriodStart?: Date | null;
  /**
   * Extra AI credits purchased as add-ons.
   * These are consumed only after the monthly quota is exhausted.
   */
  aiExtraCredits?: number;
  /** Razorpay customer + subscription identifiers. */
  razorpayCustomerId?: string;
  razorpaySubscriptionId?: string;
  /** Soft-block flag — set true to refuse sign-in. */
  banned?: boolean;
  bannedReason?: string;
  /** GDPR deletion fields. Set when user requests deletion. */
  deletionScheduledFor?: Date | null;
  deletionCancelToken?: string;
  deletionRequestedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      unique: [true, "Email already exists!"],
      required: [true, "Email is required!"],
    },
    name: {
      type: String,
      required: [true, "Name is required!"],
      trim: true,
      // Display name — accept ANY language/script (Tamil, accents, dots,
      // apostrophes, CJK, etc.). NO character restriction, so an OAuth/Google
      // name can never block sign-in; only a sane max length is enforced. The
      // URL-safe, English-only handle is `username` (validated below).
      maxlength: [100, "Name is too long (max 100 characters)."],
    },
    username: {
      type: String,
      required: [true, "Username is required!"],
      // Case is PRESERVED (no `lowercase: true`) so the display handle keeps the
      // user's chosen capitalization. Uniqueness is enforced case-INSENSITIVELY
      // by a collation index declared below (not a field-level `unique`), so
      // "Bob" and "bob" can't both exist. Letters of either case are allowed.
      trim: true,
      validate: {
        validator: validateFormatWhenModified(
          "username",
          /^(?=.{6,20}$)(?![_-])(?!.*[_-]{2})[a-zA-Z0-9_-]+(?<![_-])$/,
        ),
        message:
          "Username must be 6-20 characters: letters, numbers, _ or - (no leading/trailing or doubled separators).",
      },
    },
    // The retired handle from the user's one-time change. No default, so it is
    // absent (not "") until set, keeping the sparse index below lean.
    previousUsername: { type: String },
    usernameChangedAt: { type: Date, default: null },
    bio: {
      type: String,
      default: "",
      maxlength: [160, "Bio cannot exceed 160 characters!"],
    },
    socials: {
      twitter: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      github: { type: String, default: "" },
    },
    website: { type: String, default: "" },
    image: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["admin", "author", "user"],
      default: "user",
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    bookmarksCount: { type: Number, default: 0 },
    geminiApiKey: {
      type: String,
      default: "",
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
    },
    plan: {
      type: String,
      enum: ["free", "pro", "business"],
      default: "free",
    },
    planStatus: {
      type: String,
      enum: ["active", "past_due", "canceled"],
      default: "active",
    },
    planRenewsAt: {
      type: Date,
      default: null,
    },
    aiGenerationCount: {
      type: Number,
      default: 0,
    },
    aiUsagePeriodStart: {
      type: Date,
      default: null,
    },
    aiExtraCredits: {
      type: Number,
      default: 0,
    },
    razorpayCustomerId: { type: String, default: "", index: true },
    razorpaySubscriptionId: { type: String, default: "", index: true },
    banned: { type: Boolean, default: false, index: true },
    bannedReason: { type: String, default: "" },
    deletionScheduledFor: { type: Date, default: null, index: true },
    deletionCancelToken: { type: String, default: "", index: true },
    deletionRequestedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

// Case-insensitive UNIQUE index on username (collation strength 2 = ignore
// case). This both enforces "vignesh-devil" and "Vignesh-Devil" as the same
// (no duplicates) and backs case-insensitive lookups. Replaces the old
// field-level `unique: true` (which was case-sensitive). The pre-existing
// `username_1` index must be dropped first — see migrateUsernameIndex.ts.
UserSchema.index(
  { username: 1 },
  {
    unique: true,
    collation: { locale: "en", strength: 2 },
    name: "username_ci_unique",
  },
);

// Sparse, case-insensitive index on the retired handle. Backs the old-username
// 301-redirect lookup and the "is this handle reserved by someone's history?"
// reservation check. Sparse: only changed users carry the field, so it stays small.
UserSchema.index(
  { previousUsername: 1 },
  {
    collation: { locale: "en", strength: 2 },
    name: "previous_username_ci",
    sparse: true,
  },
);

export const User: Model<IUser> = models.User || model<IUser>("User", UserSchema);
