"use client";

import { useQuery } from "@tanstack/react-query";

export const UNREAD_COUNT_KEY = ["notifications", "unread-count"] as const;

/** How often an open, visible tab re-checks for new notifications. */
const POLL_MS = 60_000;

/**
 * Unread notification count for the signed-in user.
 *
 * Every caller (navbar bell, sidebar, notifications page) shares one cache
 * entry, so the page polls once no matter how many badges are on screen.
 * Polling pauses while the tab is hidden and refreshes when it regains focus.
 */
export function useUnreadNotificationCount(enabled: boolean) {
  return useQuery({
    queryKey: UNREAD_COUNT_KEY,
    queryFn: async (): Promise<number> => {
      const res = await fetch("/api/notifications/unread-count", {
        cache: "no-store",
      });
      // Signed out, banned, or session expired: no badge, and no error loop.
      if (res.status === 401) return 0;
      if (!res.ok) throw new Error("Failed to load notification count");
      const data = (await res.json()) as { count?: number };
      return typeof data.count === "number" ? data.count : 0;
    },
    enabled,
    staleTime: 30_000,
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: 1,
  });
}
