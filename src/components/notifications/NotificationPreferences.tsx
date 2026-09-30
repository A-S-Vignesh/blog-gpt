"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FaBell } from "react-icons/fa";
import { useToast } from "@/provider/ToastProvider";
import type { NotificationPrefs, NotificationType } from "@/types/notification";

const PREFS_KEY = ["notification-prefs"] as const;

const OPTIONS: { type: NotificationType; label: string; description: string }[] =
  [
    {
      type: "comment",
      label: "Comments on your posts",
      description: "Someone comments on a post you wrote.",
    },
    {
      type: "reply",
      label: "Replies to your comments",
      description: "Someone replies to a comment you left.",
    },
    {
      type: "like",
      label: "Likes on your posts",
      description: "Someone likes a post you wrote.",
    },
    {
      type: "follow",
      label: "New followers",
      description: "Someone starts following you.",
    },
  ];

/**
 * Settings card: per-type on/off switches. Each switch saves immediately
 * (optimistic, rolled back on failure), so it lives outside the profile form
 * and its Save button.
 */
export default function NotificationPreferences({
  className = "",
}: {
  className?: string;
}) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Settings renders a skeleton first, so the browser's own jump to
  // #notifications (linked from the notifications page) finds nothing. Do it
  // once this card actually exists.
  useEffect(() => {
    if (window.location.hash === "#notifications") {
      document
        .getElementById("notifications")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const { data: prefs, isLoading, isError } = useQuery({
    queryKey: PREFS_KEY,
    queryFn: async (): Promise<NotificationPrefs> => {
      const res = await fetch("/api/notifications/preferences", {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Could not load notification settings");
      }
      return data.prefs as NotificationPrefs;
    },
  });

  async function toggle(type: NotificationType) {
    if (!prefs) return;
    const previous = prefs;
    const next = !prefs[type];
    queryClient.setQueryData(PREFS_KEY, { ...prefs, [type]: next });
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [type]: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Could not save notification settings");
      }
      queryClient.setQueryData(PREFS_KEY, data.prefs as NotificationPrefs);
    } catch (err: any) {
      queryClient.setQueryData(PREFS_KEY, previous);
      showToast(err?.message || "Could not save notification settings", "error");
    }
  }

  return (
    <section
      id="notifications"
      className={`rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-100 shadow-sm p-6 scroll-mt-24 ${className}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <FaBell className="text-blue-600 dark:text-blue-400" />
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          Notifications
        </h3>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Choose what shows up under the bell. Turning one off stops new
        notifications of that kind; ones you already have stay.
      </p>

      {isError ? (
        <p className="text-sm text-red-600 dark:text-red-400">
          We couldn&apos;t load your notification settings. Refresh to try
          again.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {OPTIONS.map((opt) => {
            const checked = prefs?.[opt.type] ?? true;
            const labelId = `notif-pref-${opt.type}`;
            return (
              <li
                key={opt.type}
                className="flex items-center justify-between gap-4 py-3"
              >
                <div>
                  <p
                    id={labelId}
                    className="text-sm font-medium text-gray-900 dark:text-white"
                  >
                    {opt.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {opt.description}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={checked}
                  aria-labelledby={labelId}
                  disabled={isLoading || !prefs}
                  onClick={() => toggle(opt.type)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-dark-100 disabled:opacity-50 ${
                    checked ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-700"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      checked ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
