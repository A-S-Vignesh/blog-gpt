"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { FaArrowUp, FaBell, FaSpinner } from "react-icons/fa";
import { useToast } from "@/provider/ToastProvider";
import NotificationItem from "./NotificationItem";
import {
  UNREAD_COUNT_KEY,
  useUnreadNotificationCount,
} from "./useUnreadCount";
import {
  formatUnreadBadge,
  type NotificationFilter,
  type NotificationItem as Item,
  type NotificationsPage,
} from "@/types/notification";

const TABS: { id: NotificationFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "comments", label: "Comments" },
  { id: "likes", label: "Likes" },
  { id: "follows", label: "Follows" },
];

const EMPTY_COPY: Record<NotificationFilter, { title: string; body: string }> =
  {
    all: {
      title: "No notifications yet",
      body: "When someone comments on your posts, replies to you, likes a post, or follows you, you'll see it here.",
    },
    comments: {
      title: "No comments yet",
      body: "Comments on your posts and replies to your comments show up here.",
    },
    likes: {
      title: "No likes yet",
      body: "When someone likes one of your posts, you'll see it here.",
    },
    follows: {
      title: "No new followers yet",
      body: "When someone follows you, you'll see it here.",
    },
  };

function RowSkeleton() {
  return (
    <li className="flex gap-4 px-4 py-4 animate-pulse">
      <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-gray-800" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-3.5 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-2.5 w-16 rounded bg-gray-200 dark:bg-gray-800" />
      </div>
    </li>
  );
}

export default function NotificationsClient({
  initialPage,
}: {
  initialPage: NotificationsPage;
}) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { data: unreadCount = 0 } = useUnreadNotificationCount(true);

  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [items, setItems] = useState<Item[]>(initialPage.data);
  const [cursor, setCursor] = useState<string | null>(initialPage.nextCursor);
  const [loading, setLoading] = useState<"page" | "more" | null>(null);
  // True while the unread count is being reconciled with what's on screen.
  // Hides the "new notifications" button meanwhile, so the badge's old count
  // doesn't flash it on arrival or right after a tab switch.
  const [syncing, setSyncing] = useState(true);
  // Bumped on every tab switch so a slow response for a tab the user already
  // left can't overwrite the one they're looking at.
  const requestId = useRef(0);

  // Opening the page counts as seeing what it shows: mark those read so the
  // badge clears, while each row keeps its "new" highlight for this visit.
  const markSeen = useCallback(
    async (before: string, tab: NotificationFilter) => {
      await queryClient.cancelQueries({ queryKey: UNREAD_COUNT_KEY });
      queryClient.setQueryData(UNREAD_COUNT_KEY, 0);
      try {
        const res = await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ all: true, before, filter: tab }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error);
        // Anything that arrived after the page loaded is still unread; the
        // real count brings up the "new notifications" button for it.
        if (typeof data.unreadCount === "number") {
          queryClient.setQueryData(UNREAD_COUNT_KEY, data.unreadCount);
        }
      } catch {
        // Not worth a toast: the next poll restores the true count.
        void queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
      } finally {
        setSyncing(false);
      }
    },
    [queryClient],
  );

  useEffect(() => {
    void markSeen(initialPage.fetchedAt, "all");
  }, [markSeen, initialPage.fetchedAt]);

  const loadFirstPage = useCallback(
    async (tab: NotificationFilter) => {
      const id = ++requestId.current;
      setFilter(tab);
      setLoading("page");
      try {
        const res = await fetch(`/api/notifications?filter=${tab}`, {
          cache: "no-store",
        });
        const data = (await res.json()) as NotificationsPage & {
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data?.error || "Could not load notifications");
        }
        if (id !== requestId.current) return;
        setSyncing(true);
        setItems(data.data);
        setCursor(data.nextCursor);
        void markSeen(data.fetchedAt, tab);
      } catch (err: any) {
        if (id === requestId.current) {
          showToast(err?.message || "Could not load notifications", "error");
        }
      } finally {
        if (id === requestId.current) setLoading(null);
      }
    },
    [markSeen, showToast],
  );

  const loadMore = useCallback(async () => {
    if (!cursor || loading) return;
    const id = requestId.current;
    setLoading("more");
    try {
      const res = await fetch(
        `/api/notifications?filter=${filter}&cursor=${encodeURIComponent(cursor)}`,
        { cache: "no-store" },
      );
      const data = (await res.json()) as NotificationsPage & {
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data?.error || "Could not load more notifications");
      }
      if (id !== requestId.current) return;
      setItems((prev) => {
        const seen = new Set(prev.map((n) => n._id));
        return [...prev, ...data.data.filter((n) => !seen.has(n._id))];
      });
      setCursor(data.nextCursor);
    } catch (err: any) {
      if (id === requestId.current) {
        showToast(err?.message || "Could not load more notifications", "error");
      }
    } finally {
      if (id === requestId.current) setLoading(null);
    }
  }, [cursor, loading, filter, showToast]);

  const empty = EMPTY_COPY[filter];

  return (
    <>
      {/* New activity while the page is open. Always opens "All", so nothing
          in another tab gets marked read without being shown. */}
      {unreadCount > 0 && loading !== "page" && !syncing && (
        <div className="sticky top-20 z-10 flex justify-center mb-4">
          <button
            type="button"
            onClick={() => loadFirstPage("all")}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-lg transition"
          >
            <FaArrowUp className="text-xs" />
            {formatUnreadBadge(unreadCount)} new{" "}
            {unreadCount === 1 ? "notification" : "notifications"}
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-100 overflow-hidden">
        <div
          role="tablist"
          aria-label="Filter notifications"
          className="flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto"
        >
          {TABS.map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  if (!active) void loadFirstPage(tab.id);
                }}
                className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition ${
                  active
                    ? "border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {loading === "page" ? (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
          </ul>
        ) : items.length === 0 && !cursor ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
              <FaBell className="text-2xl text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {empty.title}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
              {empty.body}
            </p>
            {filter === "all" && (
              <Link
                href="/post/create"
                className="inline-block mt-6 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition"
              >
                Write a post
              </Link>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {items.map((n) => (
              <NotificationItem key={n._id} notification={n} isNew={!n.read} />
            ))}
          </ul>
        )}
      </div>

      {cursor && loading !== "page" && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading === "more"}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading === "more" && <FaSpinner className="animate-spin" />}
            {loading === "more" ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </>
  );
}
