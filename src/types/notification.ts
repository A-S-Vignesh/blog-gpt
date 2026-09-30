// Shared by the Notification model, the API, and client components. Keep this
// file free of server-only imports (mongoose, etc.) so the client can use it.

export const NOTIFICATION_TYPES = ["comment", "reply", "like", "follow"] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type NotificationPrefs = Record<NotificationType, boolean>;

/** Tabs on the /notifications page. */
export const NOTIFICATION_FILTERS = ["all", "comments", "likes", "follows"] as const;
export type NotificationFilter = (typeof NOTIFICATION_FILTERS)[number];

/** Which types each tab shows; `null` means every type. */
export const NOTIFICATION_TYPES_BY_FILTER: Record<
  NotificationFilter,
  NotificationType[] | null
> = {
  all: null,
  comments: ["comment", "reply"],
  likes: ["like"],
  follows: ["follow"],
};

export function parseNotificationFilter(
  value: string | null | undefined,
): NotificationFilter {
  return (NOTIFICATION_FILTERS as readonly string[]).includes(value ?? "")
    ? (value as NotificationFilter)
    : "all";
}

/** The badge shows "99+" past this; counting further is wasted work. */
export const UNREAD_COUNT_CAP = 100;

export function formatUnreadBadge(count: number): string {
  return count >= UNREAD_COUNT_CAP ? "99+" : String(count);
}

export type NotificationItem = {
  _id: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  snippet: string;
  actor: {
    _id: string;
    name: string;
    username: string;
    image?: string;
  };
  /** Null for follows. `username` is the post author's current handle. */
  post: { title: string; slug: string; username: string } | null;
  commentId: string | null;
};

export type NotificationsPage = {
  data: NotificationItem[];
  nextCursor: string | null;
  /**
   * Server time the page was read. Marking "everything up to here" as read
   * (rather than "everything") keeps a notification that lands a moment later
   * unread until the user has actually seen it.
   */
  fetchedAt: string;
};
