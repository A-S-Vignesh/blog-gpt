"use client";

import Link from "next/link";
import { FaPen, FaBell, FaSearch } from "react-icons/fa";
import TrendingSection from "@/components/feed/TrendingSection";
import RecentPosts from "@/components/feed/RecentPosts";

export default function FeedHomepage({ user }: { user: any }) {
  return (
    // Width and padding come from AppShell, same as every other page.
    <div>
      {/* 📰 FEED */}
      <div>
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {user?.name?.split(" ")[0] || "there"}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Here&apos;s what&apos;s happening in your personalized feed
          </p>
        </div>

        <TrendingSection />
        <RecentPosts />
      </div>

      {/* ✍️ FLOATING WRITE BUTTON */}
      <Link
        href="/post/create"
        aria-label="Write a new post"
        className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 z-30"
      >
        <FaPen className="text-xl" />
      </Link>
    </div>
  );
}
