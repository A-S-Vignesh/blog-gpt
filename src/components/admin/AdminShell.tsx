"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  FaChartPie,
  FaFileAlt,
  FaComments,
  FaEnvelope,
  FaUsers,
  FaHistory,
  FaBullhorn,
  FaShieldAlt,
  FaBars,
  FaTimes,
  FaArrowLeft,
} from "react-icons/fa";

export type AdminBadges = {
  flaggedPosts: number;
  unreadMessages: number;
  pendingAds: number;
};

const NAV = [
  { href: "/admin", label: "Dashboard", icon: FaChartPie, badge: null },
  { href: "/admin/posts", label: "Posts", icon: FaFileAlt, badge: "flaggedPosts" },
  { href: "/admin/comments", label: "Comments", icon: FaComments, badge: null },
  {
    href: "/admin/messages",
    label: "Messages",
    icon: FaEnvelope,
    badge: "unreadMessages",
  },
  {
    href: "/admin/ads",
    label: "Advertising",
    icon: FaBullhorn,
    badge: "pendingAds",
  },
  { href: "/admin/users", label: "Users", icon: FaUsers, badge: null },
  { href: "/admin/audit", label: "Audit log", icon: FaHistory, badge: null },
] as const;

/**
 * Chrome for the admin area.
 *
 * Purely presentational — it renders no data of its own and gates nothing.
 * Authorization happens before this ever mounts: proxy.ts turns away signed-out
 * visitors, and the /admin layout checks the role against MongoDB.
 */
export default function AdminShell({
  adminName,
  badges,
  children,
}: {
  adminName: string;
  badges: AdminBadges;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-col gap-1 p-3">
      {NAV.map(({ href, label, icon: Icon, badge }) => {
        // Exact match for the dashboard root, prefix match for sections — so
        // /admin/posts doesn't light up "Dashboard" too.
        const active =
          href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        const count = badge ? badges[badge] : 0;

        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            <Icon className="shrink-0" />
            <span className="flex-1">{label}</span>
            {count > 0 && (
              <span
                className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-xs font-bold ${
                  active ? "bg-white text-blue-600" : "bg-red-500 text-white"
                }`}
              >
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>
        );
      })}

      <Link
        href="/"
        className="mt-4 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
      >
        <FaArrowLeft className="shrink-0" />
        Back to site
      </Link>
    </nav>
  );

  return (
    <div className="flex min-h-screen w-full bg-gray-50 dark:bg-dark-100">
      {/* ── DESKTOP SIDEBAR ─────────────────────────────────────────── */}
      <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white lg:block dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-4 dark:border-gray-800">
          <FaShieldAlt className="text-blue-600" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              Admin
            </p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
              {adminName}
            </p>
          </div>
        </div>
        {nav}
      </aside>

      {/* ── MOBILE DRAWER ───────────────────────────────────────────── */}
      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-64 bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4 dark:border-gray-800">
              <span className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                <FaShieldAlt className="text-blue-600" /> Admin
              </span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="text-gray-500 hover:text-gray-900 dark:hover:text-white"
              >
                <FaTimes />
              </button>
            </div>
            {nav}
          </div>
        </div>
      )}

      {/* ── CONTENT ─────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 lg:hidden dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
        >
          <FaBars /> Admin menu
        </button>
        <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
