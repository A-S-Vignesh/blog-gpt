"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaBell } from "react-icons/fa";
import { formatUnreadBadge } from "@/types/notification";
import { useUnreadNotificationCount } from "./useUnreadCount";

/** Navbar bell with an unread badge. Render only for signed-in users. */
export default function NotificationBell() {
  const pathname = usePathname();
  const { data: count = 0 } = useUnreadNotificationCount(true);
  const active = pathname.startsWith("/notifications");

  const label =
    count > 0
      ? `Notifications, ${formatUnreadBadge(count)} unread`
      : "Notifications";

  return (
    <Link
      href="/notifications"
      aria-label={label}
      title="Notifications"
      className={`relative w-10 h-10 rounded-full flex items-center justify-center text-lg transition ${
        active
          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
      }`}
    >
      <FaBell />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold leading-none flex items-center justify-center ring-2 ring-white dark:ring-dark-100"
        >
          {formatUnreadBadge(count)}
        </span>
      )}
    </Link>
  );
}
