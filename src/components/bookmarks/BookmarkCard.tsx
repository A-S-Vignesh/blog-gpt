"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaTrash, FaRegClock, FaHeart, FaComment } from "react-icons/fa";
import { optimizeImage, COMMON_IMAGE_SIZES } from "@/lib/images";
import { timeAgo } from "@/utils/timeAgo";
import { useToast } from "@/provider/ToastProvider";
import type { BookmarkedItem } from "@/lib/data/bookmarks";

const DEFAULT_COVER =
  "https://res.cloudinary.com/ddj4zaxln/image/upload/laptop_hyujfu.png";

export default function BookmarkCard({
  item,
  onRemoved,
}: {
  item: BookmarkedItem;
  onRemoved: (id: string) => void;
}) {
  const { showToast } = useToast();
  const [removing, setRemoving] = useState(false);
  const { post } = item;
  const href = `/${post.creator.username}/${post.slug}`;

  async function handleRemove(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (removing) return;
    setRemoving(true);
    try {
      const res = await fetch(
        `/api/post/${post.creator.username}/${post.slug}/bookmark`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookmarked: false }),
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Could not remove bookmark.");
      }
      // Parent updates the list optimistically.
      onRemoved(item._id);
      showToast("Removed from bookmarks", "success");
    } catch (err: any) {
      showToast(err?.message || "Failed to remove bookmark", "error");
      setRemoving(false);
    }
  }

  return (
    <article className="group bg-white dark:bg-gray-900 rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden flex flex-col">
      <Link href={href} className="block">
        <div className="relative aspect-3/2 w-full">
          <Image
            src={optimizeImage(post.image || DEFAULT_COVER, { width: 800 })}
            alt={post.title}
            fill
            sizes={COMMON_IMAGE_SIZES.card}
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </Link>

      <div className="p-5 flex flex-col flex-1">
        {/* Author + reading time */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
          <Link
            href={`/${post.creator.username}`}
            className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition"
          >
            <div className="relative w-7 h-7 rounded-full overflow-hidden">
              <Image
                src={
                  post.creator.image || "/assets/images/default-avatar.png"
                }
                alt={post.creator.name}
                fill
                className="object-cover"
              />
            </div>
            <span className="font-medium text-gray-800 dark:text-gray-100">
              {post.creator.name || post.creator.username}
            </span>
          </Link>
          <div className="flex items-center gap-1.5">
            <FaRegClock />
            <span>
              {Math.max(1, post.readingTime || 0)} min
            </span>
          </div>
        </div>

        {/* Title */}
        <Link href={href}>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
            {post.title}
          </h2>
        </Link>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
            {post.excerpt}
          </p>
        )}

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[11px] rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer: counts + saved-time + remove */}
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1">
              <FaHeart className="text-red-400" /> {post.likesCount}
            </span>
            <span className="inline-flex items-center gap-1">
              <FaComment /> {post.commentsCount}
            </span>
            <span className="text-gray-400 dark:text-gray-500">
              · Saved {timeAgo(item.bookmarkedAt)}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={removing}
            aria-label="Remove bookmark"
            title="Remove bookmark"
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition disabled:opacity-60"
          >
            <FaTrash />
            <span className="hidden sm:inline">
              {removing ? "Removing…" : "Remove"}
            </span>
          </button>
        </div>
      </div>
    </article>
  );
}
