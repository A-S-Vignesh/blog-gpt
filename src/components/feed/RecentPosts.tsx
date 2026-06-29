"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FaHeart,
  FaComment,
  FaBookmark,
  FaShareAlt,
  FaRegClock,
  FaFire,
} from "react-icons/fa";
import { useInfiniteQuery } from "@tanstack/react-query";
import { PopulatedClientPost } from "@/types/post";
import RecentShimmer from "../shimmer/RecentShimmer";
import Tags from "../Tags";
import InfinitySpin from "../ui/InfiniteSpin";

type RecentApiResponse = {
  data: PopulatedClientPost[];
  page: { remaining: number; nextPage: number };
};

async function fetchRecentPosts({
  pageParam = 0,
}: {
  pageParam?: number;
}): Promise<RecentApiResponse> {
  const res = await fetch(`/api/post/recent?skip=${pageParam}&limit=6`);
  if (!res.ok) throw new Error("Failed to load recent posts");
  return res.json();
}

const RecentPosts = () => {
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["recent-posts"],
    queryFn: fetchRecentPosts,
    getNextPageParam: (lastPage) =>
      lastPage.page.remaining > 0 ? lastPage.page.nextPage : undefined,
    staleTime: 60_000,
    initialPageParam: 0,
  });

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px 0px", threshold: 0 },
    );

    observer.observe(target);
    return () => observer.unobserve(target);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allPosts: PopulatedClientPost[] =
    data?.pages.flatMap((page) => page.data ?? []) ?? [];

  if (isLoading) {
    return (
      <div className="mb-12">
        <div className="flex items-center mb-6">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg mr-3">
            <FaRegClock className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Recent Posts
          </h2>
        </div>
        <RecentShimmer />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mb-12">
        <div className="flex items-center mb-6">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg mr-3">
            <FaRegClock className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Recent Posts
          </h2>
        </div>
        <p className="text-red-500 text-sm">
          Failed to load posts. Please try again later.
        </p>
      </div>
    );
  }

  if (allPosts.length === 0) {
    return (
      <div className="mb-12">
        <div className="flex items-center mb-6">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg mr-3">
            <FaRegClock className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Recent Posts
          </h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          No posts yet. Be the first to{" "}
          <Link
            href="/post/create"
            className="text-blue-600 dark:text-blue-400 font-medium underline"
          >
            create a post
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg mr-3">
            <FaRegClock className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Recent Posts
          </h2>
        </div>
        <Link
          href="/explore"
          className="text-blue-600 dark:text-blue-400 hover:underline font-medium text-sm"
        >
          See all
        </Link>
      </div>

      <div className="space-y-6">
        {allPosts.map((post) => (
          <Link
            key={post._id}
            href={`/${post.creator.username}/${post.slug}`}
            className="block bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 hover:shadow-lg hover:-translate-y-0.5 transition"
          >
            <div className="flex flex-col md:flex-row gap-6">
              {/* Post Content */}
              <div className="flex-1">
                {/* Author Info */}
                <div className="flex items-center mb-4">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden mr-3">
                    <Image
                      src={
                        post.creator.image ||
                        "/assets/images/default-avatar.png"
                      }
                      alt={post.creator.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {post.creator.name || post.creator.username}
                      </p>
                      {post.likesCount > 20 && (
                        <span className="ml-2 px-2 py-0.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs rounded-full flex items-center">
                          <FaFire className="mr-1" /> Trending
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {post.readingTime ? `${post.readingTime} min read` : ""} ·{" "}
                      {new Date(post.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Title and Excerpt */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 hover:text-blue-600 dark:hover:text-blue-400 transition line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {post.excerpt}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <Tags tags={post.tags} limit={3} />
                </div>

                {/* Engagement Stats */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <FaHeart className="mr-1" />
                      <span className="text-sm">{post.likesCount}</span>
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <FaComment className="mr-1" />
                      <span className="text-sm">{post.commentsCount}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={(e) => e.preventDefault()}
                      className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <FaBookmark />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => e.preventDefault()}
                      className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <FaShareAlt />
                    </button>
                  </div>
                </div>
              </div>

              {/* Featured Image (Desktop) */}
              <div className="hidden md:block aspect-3/2 h-64 relative rounded-xl overflow-hidden shrink-0">
                <Image
                  src={post.image || "/assets/images/laptop.jpg"}
                  alt={post.title}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Infinite scroll trigger */}
      <div ref={loadMoreRef} className="h-8" />

      {/* Spinner while loading next page */}
      {isFetchingNextPage && (
        <div className="w-full flex items-center justify-center mt-4">
          <InfinitySpin />
        </div>
      )}

      {/* All caught up */}
      {!hasNextPage && allPosts.length > 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-6">
          You&apos;ve seen all recent posts ✓
        </p>
      )}
    </div>
  );
};

export default RecentPosts;
