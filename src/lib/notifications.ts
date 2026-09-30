import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import Notification from "@/models/Notification";
import { User } from "@/models/User";
import {
  NOTIFICATION_TYPES,
  type NotificationPrefs,
  type NotificationType,
} from "@/types/notification";

type Id = string | Types.ObjectId;

export type NotifyInput = {
  type: NotificationType;
  recipient: Id;
  actor: Id;
  post?: Id | null;
  comment?: Id | null;
  /** Comment text; trimmed to a short preview before it is stored. */
  snippet?: string;
};

const SNIPPET_MAX = 140;

/** Fill in missing keys: a type is enabled unless explicitly set to false. */
export function normalizePrefs(
  raw: Partial<NotificationPrefs> | null | undefined,
): NotificationPrefs {
  return Object.fromEntries(
    NOTIFICATION_TYPES.map((t) => [t, raw?.[t] !== false]),
  ) as NotificationPrefs;
}

// Likes and follows are relationships, not events, so each gets exactly one
// notification per (actor, target). These keys make that write idempotent and
// let unlike/unfollow retract it precisely.
export const likeDedupeKey = (postId: Id, actorId: Id) =>
  `like:${postId}:${actorId}`;
export const followDedupeKey = (recipientId: Id, actorId: Id) =>
  `follow:${recipientId}:${actorId}`;

function dedupeKeyFor(n: NotifyInput): string | undefined {
  if (n.type === "like" && n.post) return likeDedupeKey(n.post, n.actor);
  if (n.type === "follow") return followDedupeKey(n.recipient, n.actor);
  return undefined;
}

function toSnippet(text?: string): string {
  if (!text) return "";
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > SNIPPET_MAX
    ? `${flat.slice(0, SNIPPET_MAX - 1).trimEnd()}…`
    : flat;
}

/**
 * Record one or more notifications.
 *
 * Best-effort by design: a notification is a side effect of the like, comment,
 * or follow the user actually asked for, so it must never fail that request.
 * Errors are logged and swallowed.
 *
 * Skips self-notifications (liking your own post) and any type the recipient
 * has turned off in Settings.
 */
export async function notify(inputs: NotifyInput | NotifyInput[]): Promise<void> {
  const list = (Array.isArray(inputs) ? inputs : [inputs]).filter(
    (n) => String(n.recipient) !== String(n.actor),
  );
  if (list.length === 0) return;

  try {
    await connectToDatabase();

    // One read covers every recipient's preferences. A recipient that no
    // longer exists has no entry, so nothing is written for them.
    const recipientIds = [...new Set(list.map((n) => String(n.recipient)))];
    const users = await User.find({ _id: { $in: recipientIds } })
      .select("notificationPrefs")
      .lean<
        { _id: Types.ObjectId; notificationPrefs?: Partial<NotificationPrefs> }[]
      >();
    const prefsById = new Map(
      users.map((u) => [String(u._id), normalizePrefs(u.notificationPrefs)]),
    );

    const wanted = list.filter(
      (n) => prefsById.get(String(n.recipient))?.[n.type] === true,
    );

    await Promise.all(
      wanted.map(async (n) => {
        const doc = {
          recipient: n.recipient,
          actor: n.actor,
          type: n.type,
          post: n.post ?? null,
          comment: n.comment ?? null,
          snippet: toSnippet(n.snippet),
          read: false,
        };

        const dedupeKey = dedupeKeyFor(n);
        if (!dedupeKey) {
          await Notification.create(doc);
          return;
        }

        try {
          // The filter's equality on `dedupeKey` is copied into the inserted
          // doc, so it doesn't need repeating in $setOnInsert. `_id` is minted
          // here rather than by the server on upsert: the inbox sorts and
          // paginates by `_id`, and server-made ids don't interleave in time
          // order with the app-made ids of `create()` within the same second.
          await Notification.updateOne(
            { dedupeKey },
            { $setOnInsert: { _id: new Types.ObjectId(), ...doc } },
            { upsert: true },
          );
        } catch (err: any) {
          // Two concurrent upserts on the same key: the loser trips the unique
          // index. The notification exists either way, so that's success.
          if (err?.code !== 11000) throw err;
        }
      }),
    );
  } catch (err) {
    console.error("[notifications] notify failed:", err);
  }
}

/** Withdraw a like/follow notification (unlike, unfollow). Best-effort. */
export async function retractNotification(dedupeKey: string): Promise<void> {
  try {
    await connectToDatabase();
    await Notification.deleteOne({ dedupeKey });
  } catch (err) {
    console.error("[notifications] retract failed:", err);
  }
}

/** Drop notifications that point at comments which were just deleted. */
export async function deleteNotificationsForComments(
  commentIds: Id[],
): Promise<void> {
  if (commentIds.length === 0) return;
  try {
    await connectToDatabase();
    await Notification.deleteMany({ comment: { $in: commentIds } });
  } catch (err) {
    console.error("[notifications] comment cleanup failed:", err);
  }
}

/** Drop every notification about a post that was just deleted. */
export async function deleteNotificationsForPost(postId: Id): Promise<void> {
  try {
    await connectToDatabase();
    await Notification.deleteMany({ post: postId });
  } catch (err) {
    console.error("[notifications] post cleanup failed:", err);
  }
}
