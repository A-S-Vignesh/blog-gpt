import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import Notification from "@/models/Notification";
import "@/models/Post";
import "@/models/User";
import "@/models/Comment";
import {
  NOTIFICATION_TYPES_BY_FILTER,
  UNREAD_COUNT_CAP,
  type NotificationFilter,
  type NotificationItem,
  type NotificationsPage,
} from "@/types/notification";

const PAGE_SIZE = 20;

/**
 * A page of the signed-in user's notifications, newest first.
 *
 * Rows whose subject is gone (actor deleted or banned, post or comment
 * deleted) are dropped from the page. Deletes normally cascade to
 * notifications, so this is the safety net for anything that slipped through.
 * The cursor is taken from the RAW page, so dropped rows are never re-fetched
 * and never cause a skip.
 */
export async function getUserNotifications(
  userId: string,
  options: {
    cursor?: string | null;
    limit?: number;
    filter?: NotificationFilter;
  } = {},
): Promise<NotificationsPage> {
  const limit = Math.min(50, Math.max(1, options.limit ?? PAGE_SIZE));
  const fetchedAt = new Date().toISOString();

  if (!userId || !Types.ObjectId.isValid(userId)) {
    return { data: [], nextCursor: null, fetchedAt };
  }

  await connectToDatabase();

  const query: Record<string, unknown> = {
    recipient: new Types.ObjectId(userId),
  };
  const types = NOTIFICATION_TYPES_BY_FILTER[options.filter ?? "all"];
  if (types) {
    query.type = types.length === 1 ? types[0] : { $in: types };
  }
  if (options.cursor && Types.ObjectId.isValid(options.cursor)) {
    query._id = { $lt: new Types.ObjectId(options.cursor) };
  }

  const raw = await Notification.find(query)
    .sort({ _id: -1 })
    .limit(limit + 1)
    .populate("actor", "name username image banned")
    .populate({
      path: "post",
      select: "title slug creator",
      populate: { path: "creator", select: "username" },
    })
    .populate("comment", "_id")
    .lean<any[]>();

  const hasMore = raw.length > limit;
  const slice = hasMore ? raw.slice(0, limit) : raw;
  const nextCursor = hasMore ? String(slice[slice.length - 1]._id) : null;

  const data: NotificationItem[] = slice
    .filter((n: any) => {
      if (!n.actor?.username || n.actor.banned) return false;
      if (n.type === "follow") return true;
      if (!n.post?.slug || !n.post.creator?.username) return false;
      if ((n.type === "comment" || n.type === "reply") && !n.comment) {
        return false;
      }
      return true;
    })
    .map((n: any) => ({
      _id: String(n._id),
      type: n.type,
      read: Boolean(n.read),
      createdAt: new Date(n.createdAt).toISOString(),
      snippet: n.snippet ?? "",
      actor: {
        _id: String(n.actor._id),
        name: n.actor.name || n.actor.username,
        username: n.actor.username,
        image: n.actor.image || undefined,
      },
      post:
        n.type === "follow"
          ? null
          : {
              title: n.post.title,
              slug: n.post.slug,
              username: n.post.creator.username,
            },
      commentId: n.comment ? String(n.comment._id) : null,
    }));

  return { data, nextCursor, fetchedAt };
}

/** Unread count for the bell badge, capped (the UI shows "99+"). */
export async function getUnreadNotificationCount(
  userId: string,
): Promise<number> {
  if (!userId || !Types.ObjectId.isValid(userId)) return 0;
  await connectToDatabase();
  return Notification.countDocuments(
    { recipient: new Types.ObjectId(userId), read: false },
    { limit: UNREAD_COUNT_CAP },
  );
}
