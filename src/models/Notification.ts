import { Schema, model, models, Document, Types } from "mongoose";
import { NOTIFICATION_TYPES, type NotificationType } from "@/types/notification";

/** How long a notification lives before the TTL index removes it. */
export const NOTIFICATION_TTL_DAYS = 90;

/**
 * One document per "something happened to you" event.
 *
 *   comment → `actor` commented on `recipient`'s `post`
 *   reply   → `actor` replied to `recipient`'s comment on `post`
 *   like    → `actor` liked `recipient`'s `post`
 *   follow  → `actor` started following `recipient`
 *
 * `dedupeKey` is set only for likes and follows, which are reversible
 * relationships rather than events: it makes the write idempotent (a like can
 * produce at most ONE notification no matter how often it is toggled) and it
 * gives unlike/unfollow an exact key to retract the notification with.
 */
export interface INotification extends Document {
  recipient: Types.ObjectId;
  actor: Types.ObjectId;
  type: NotificationType;
  post?: Types.ObjectId | null;
  comment?: Types.ObjectId | null;
  /** Plain-text preview of the comment, captured at write time. */
  snippet?: string;
  dedupeKey?: string;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    post: { type: Schema.Types.ObjectId, ref: "Post", default: null },
    comment: { type: Schema.Types.ObjectId, ref: "Comment", default: null },
    snippet: { type: String, default: "", maxlength: 200 },
    // No default: the field must be ABSENT (not null) on comment/reply docs so
    // the sparse unique index below skips them.
    dedupeKey: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// A user's inbox, newest first; `_id` doubles as the pagination cursor.
NotificationSchema.index({ recipient: 1, _id: -1 });
// Inbox filtered by type (the Comments / Likes / Follows tabs).
NotificationSchema.index({ recipient: 1, type: 1, _id: -1 });
// Unread badge count, polled by every signed-in tab.
NotificationSchema.index({ recipient: 1, read: 1 });
// Idempotent like/follow writes + exact retraction on unlike/unfollow.
NotificationSchema.index({ dedupeKey: 1 }, { unique: true, sparse: true });
// Cascade cleanup when a comment, post, or account is deleted.
NotificationSchema.index({ comment: 1 });
NotificationSchema.index({ post: 1 });
NotificationSchema.index({ actor: 1 });
// Old notifications expire on their own, so the collection can't grow forever.
NotificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: NOTIFICATION_TTL_DAYS * 24 * 60 * 60 },
);

const Notification =
  models.Notification ||
  model<INotification>("Notification", NotificationSchema);
export default Notification;
