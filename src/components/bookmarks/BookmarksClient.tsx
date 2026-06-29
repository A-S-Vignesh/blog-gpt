"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { FaBookmark, FaSpinner } from "react-icons/fa";
import { useToast } from "@/provider/ToastProvider";
import BookmarkCard from "./BookmarkCard";
import type { BookmarkedItem, BookmarksPage } from "@/lib/data/bookmarks";

export default function BookmarksClient({
  initialPage,
}: {
  initialPage: BookmarksPage;
}) {
  const { showToast } = useToast();
  const [items, setItems] = useState<BookmarkedItem[]>(initialPage.data);
  const [hasMore, setHasMore] = useState(initialPage.page.hasMore);
  const [nextSkip, setNextSkip] = useState(initialPage.page.nextSkip);
  const [loading, setLoading] = useState(false);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/account/bookmarks?skip=${nextSkip}&limit=12`,
      );
      const data = (await res.json()) as BookmarksPage & { error?: string };
      if (!res.ok) {
        throw new Error(data?.error || "Failed to load more bookmarks");
      }
      // Dedup by _id in case of any backend skew between pages.
      setItems((prev) => {
        const seen = new Set(prev.map((b) => b._id));
        return [...prev, ...data.data.filter((b) => !seen.has(b._id))];
      });
      setHasMore(data.page.hasMore);
      setNextSkip(data.page.nextSkip);
    } catch (err: any) {
      showToast(err?.message || "Failed to load more bookmarks", "error");
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, nextSkip, showToast]);

  const handleRemoved = useCallback((bookmarkId: string) => {
    setItems((prev) => prev.filter((b) => b._id !== bookmarkId));
  }, []);

  if (items.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-700">
        <div className="mx-auto w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-4">
          <FaBookmark className="text-3xl text-yellow-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          No bookmarks yet
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
          Save posts to read later. Click the bookmark icon on any post and
          it'll show up here.
        </p>
        <Link
          href="/explore"
          className="inline-block px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
        >
          Browse posts
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((b) => (
          <BookmarkCard key={b._id} item={b} onRemoved={handleRemoved} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading && <FaSpinner className="animate-spin" />}
            {loading ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </>
  );
}
