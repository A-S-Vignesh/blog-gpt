"use client";

import { useState } from "react";
import { FaPen, FaBell, FaSearch } from "react-icons/fa";
import TrendingSection from "@/components/feed/TrendingSection";
import RecentPosts from "@/components/feed/RecentPosts";
import RightSidebar from "./RightSidebar";

export default function FeedHomepage({ user }: { user: any }) {
  return (
    <div className="min-h-screen bg-white dark:bg-dark-100">
      {/* 📱 MOBILE HEADER (only visible in mobile) */}
      <div className="lg:hidden sticky top-0 z-40 bg-white dark:bg-dark-100 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
            <FaSearch className="text-gray-700 dark:text-gray-300" />
          </button>

          <button className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 relative">
            <FaBell className="text-gray-700 dark:text-gray-300" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>

      {/* 📰 MAIN FEED CONTENT */}
      <div className="w-full max-w-3xl mx-auto px-4 py-6">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {user?.name?.split(" ")[0] || "there"}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Here’s what's happening in your personalized feed
          </p>
        </div>

        <TrendingSection />
        <RecentPosts />
      </div>
      {/* <aside className="hidden lg:block w-72 shrink-0">
        <div className="sticky top-24">
          <RightSidebar />
        </div>
      </aside> */}

      {/* ✍️ FLOATING WRITE BUTTON */}
      <button className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 z-30">
        <FaPen className="text-xl" />
      </button>
    </div>
  );
}
