"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { FaComment, FaHeart, FaReply, FaUserPlus } from "react-icons/fa";
import { timeAgo } from "@/utils/timeAgo";
import type {
  NotificationItem as Item,
  NotificationType,
} from "@/types/notification";

const TYPE_STYLES: Record<NotificationType, { icon: ReactNode; badge: string }> =
  {
    comment: { icon: <FaComment />, badge: "bg-blue-600" },
    reply: { icon: <FaReply />, badge: "bg-indigo-600" },
    like: { icon: <FaHeart />, badge: "bg-rose-600" },
    follow: { icon: <FaUserPlus />, badge: "bg-emerald-600" },
  };

/** Where clicking the notification takes you. */
export function notificationHref(n: Item): string {
  if (n.type === "follow" || !n.post) {
    // Profile URLs canonicalize to lowercase; link there directly.
    return `/${n.actor.username.toLowerCase()}`;
  }
  const postUrl = `/${n.post.username}/${n.post.slug}`;
  return n.commentId ? `${postUrl}#comment-${n.commentId}` : postUrl;
}

function Message({ n }: { n: Item }) {
  const who = (
    <span className="font-semibold text-gray-900 dark:text-white">
      {n.actor.name}
    </span>
  );
  const title = n.post ? (
    <span className="font-medium text-gray-900 dark:text-white">
      {n.post.title}
    </span>
  ) : null;

  switch (n.type) {
    case "comment":
      return (
        <>
          {who} commented on your post {title}
        </>
      );
    case "reply":
      return (
        <>
          {who} replied to your comment on {title}
        </>
      );
    case "like":
      return (
        <>
          {who} liked your post {title}
        </>
      );
    case "follow":
      return <>{who} started following you</>;
  }
}

export default function NotificationItem({
  notification: n,
  isNew,
}: {
  notification: Item;
  /** Unread when this page loaded; highlighted for the rest of the visit. */
  isNew: boolean;
}) {
  const style = TYPE_STYLES[n.type];

  return (
    <li>
      <Link
        href={notificationHref(n)}
        className={`flex gap-3 sm:gap-4 px-4 py-4 transition hover:bg-gray-50 dark:hover:bg-gray-800/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
          isNew ? "bg-blue-50/70 dark:bg-blue-900/15" : ""
        }`}
      >
        <div className="relative shrink-0 w-11 h-11">
          <div className="relative w-11 h-11 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
            <Image
              src={n.actor.image || "/assets/images/default-avatar.png"}
              alt=""
              fill
              sizes="44px"
              className="object-cover"
            />
          </div>
          <span
            aria-hidden="true"
            className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${style.badge} text-white text-[10px] flex items-center justify-center ring-2 ring-white dark:ring-dark-100`}
          >
            {style.icon}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-700 dark:text-gray-300 wrap-break-word">
            <Message n={n} />
          </p>
          {n.snippet && (
            <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400 line-clamp-2 wrap-break-word border-l-2 border-gray-200 dark:border-gray-700 pl-3">
              {n.snippet}
            </p>
          )}
          <time
            dateTime={n.createdAt}
            suppressHydrationWarning
            className="mt-1.5 block text-xs text-gray-500 dark:text-gray-400"
          >
            {timeAgo(n.createdAt)}
          </time>
        </div>

        {isNew && (
          <span className="shrink-0 mt-2 w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400">
            <span className="sr-only">New</span>
          </span>
        )}
      </Link>
    </li>
  );
}
