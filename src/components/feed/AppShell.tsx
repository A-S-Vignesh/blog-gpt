"use client";

import { usePathname } from "next/navigation";
import LeftSidebar from "@/components/feed/LeftSidebar";
import RightSidebar from "@/components/feed/RightSidebar";
import CommonFooter from "@/components/CommonFooter";
import { useState } from "react";
import { FaBars } from "react-icons/fa";

export default function AppShell({
  user,
  children,
}: {
  user: any | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isLoggedIn = !!user;

  // Right sidebar only on /feed AND only when logged in
  const showRightSidebar = isLoggedIn && pathname === "/feed";

  // If not logged in: render children with no sidebar chrome (footer is
  // full-width below the content — there's no sidebar to offset around).
  if (!isLoggedIn) {
    return (
      <>
        <main className="w-full flex-1">{children}</main>
        <CommonFooter inShell />
      </>
    );
  }

  return (
    <div className="flex w-full flex-1">
      {/* ── LEFT SIDEBAR — fixed, always on screen when logged in ── */}
      <div className="hidden lg:flex flex-col fixed top-0 left-0 h-screen w-64 z-30">
        <LeftSidebar user={user} />
      </div>

      {/* ── MOBILE SIDEBAR OVERLAY ──────────────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-10 w-64">
            <LeftSidebar user={user} onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* ── MOBILE HAMBURGER ────────────────────────────────────── */}
      <button
        className="lg:hidden fixed bottom-6 left-6 z-40 bg-white dark:bg-gray-800 shadow-lg p-3 rounded-full border border-gray-200 dark:border-gray-700"
        onClick={() => setSidebarOpen(true)}
      >
        <FaBars className="text-gray-700 dark:text-gray-300" />
      </button>

      {/* ── MAIN COLUMN — offset by the fixed left sidebar. The footer lives
            INSIDE this column so it sits to the right of the sidebar and never
            slides under it. ──────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 lg:ml-64 flex flex-col">
        <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 py-6">
          <div className="flex gap-6 max-w-7xl mx-auto">
            <div className="flex-1 min-w-0">{children}</div>

            {/* ── RIGHT SIDEBAR — sticky, scrolls with page ─────────── */}
            {showRightSidebar && (
              <aside className="hidden lg:block w-72 shrink-0 self-start sticky top-25">
                <RightSidebar />
              </aside>
            )}
          </div>
        </main>
        <CommonFooter inShell />
      </div>
    </div>
  );
}
