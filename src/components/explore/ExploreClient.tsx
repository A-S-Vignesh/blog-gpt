"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaSearch, FaRegClock, FaFire } from "react-icons/fa";
import { useInfiniteQuery } from "@tanstack/react-query";
import InfinitySpin from "@/components/ui/InfiniteSpin";
import { optimizeImage, COMMON_IMAGE_SIZES } from "@/lib/images";
import type { PopulatedClientPost } from "@/types/post";

type ExplorePost = PopulatedClientPost;

type Page = {
  data: ExplorePost[];
  page: { remaining: number; nextPage: number };
};

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function ExploreClient({
  initialPage,
}: {
  initialPage: Page;
}) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const isDefaultView = debouncedSearch.trim() === "" && !activeTag;

  const {
    data,
    isLoading,
    isFetching,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<Page>({
    queryKey: ["explore-posts", { search: debouncedSearch, tag: activeTag }],
    queryFn: async ({ pageParam = 0 }) => {
      const params = new URLSearchParams();
      params.set("skip", String(pageParam));
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      if (activeTag) params.set("tag", activeTag);
      const res = await fetch(`/api/post?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load posts");
      return (await res.json()) as Page;
    },
    // Hydrate the unfiltered default view from the server-rendered first page
    // so the page is paintable with zero client fetches on first visit.
    initialData: isDefaultView
      ? { pages: [initialPage], pageParams: [0] }
      : undefined,
    getNextPageParam: (lastPage) =>
      lastPage.page.remaining > 0 ? lastPage.page.nextPage : undefined,
    staleTime: 60_000,
    initialPageParam: 0,
  });

  // Dedupe by post `_id` when flattening pages.
  //
  // Skip/limit pagination over a list sorted by `updatedAt` is not stable
  // when the list mutates between fetches — a like / comment / edit on one
  // post bumps it to the top, which shifts every later page by 1 and can
  // re-include posts already shown on an earlier page. This is most visible
  // after navigating back to /explore: React Query refetches every loaded
  // page with its original skip value, so reorders since the last fetch
  // can create duplicates.
  //
  // The proper fix is cursor-based pagination on the API; this Set guards
  // the UI from React's "duplicate key" warning in the meantime.
  const allPosts: ExplorePost[] = (() => {
    const seen = new Set<string>();
    const out: ExplorePost[] = [];
    for (const page of data?.pages ?? []) {
      for (const post of page.data || []) {
        const id = String(post._id);
        if (seen.has(id)) continue;
        seen.add(id);
        out.push(post);
      }
    }
    return out;
  })();

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const target = loadMoreRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchNextPage();
      },
      { rootMargin: "200px 0px", threshold: 0 },
    );
    observer.observe(target);
    return () => observer.unobserve(target);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <>
      {/* Header + search */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            Explore blogs
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Discover trending, recent, and niche posts from creators on
            TheBlogGPT.
          </p>
        </div>

        <div className="w-full sm:w-80">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, author, or tag"
              aria-label="Search posts"
              className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-100 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {activeTag && (
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span>Filtered by:</span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-medium">
            #{activeTag}
            <button
              type="button"
              onClick={() => setActiveTag(null)}
              className="ml-1 hover:text-red-600 dark:hover:text-red-400"
              aria-label="Clear tag filter"
            >
              ×
            </button>
          </span>
        </div>
      )}

      {/* Content */}
      {isLoading && allPosts.length === 0 ? (
        <SkeletonGrid />
      ) : isError ? (
        <div className="mt-12 text-center text-red-500">
          Failed to load posts. Please try again.
        </div>
      ) : allPosts.length === 0 ? (
        <div className="mt-12 text-center text-gray-600 dark:text-gray-400">
          <p className="mb-2 font-medium">No posts match your search.</p>
          <p className="text-sm">Try a different keyword or clear the filter.</p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allPosts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onTagClick={setActiveTag}
            />
          ))}
        </div>
      )}

      <div ref={loadMoreRef} className="h-8" />

      {(isFetchingNextPage || (isFetching && !isLoading)) && (
        <div className="w-full flex items-center justify-center mt-4">
          <InfinitySpin />
        </div>
      )}
    </>
  );
}

function PostCard({
  post,
  onTagClick,
}: {
  post: ExplorePost;
  onTagClick: (tag: string) => void;
}) {
  const href = `/${post.creator.username}/${post.slug}`;
  return (
    <article className="group bg-white dark:bg-gray-900 rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden flex flex-col">
      <Link href={href} className="block">
        <div className="relative aspect-3/2 w-full">
          <Image
            src={optimizeImage(
              post.image ||
                "https://res.cloudinary.com/ddj4zaxln/image/upload/laptop_hyujfu.png",
              { width: 800 },
            )}
            alt={post.title}
            fill
            sizes={COMMON_IMAGE_SIZES.card}
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {(post.likesCount ?? 0) > 20 && (
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-orange-500 text-white text-xs font-semibold inline-flex items-center">
              <FaFire className="mr-1" /> Trending
            </div>
          )}
        </div>
      </Link>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
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
              {post.creator.name}
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <FaRegClock />
            <span>
              {post.readingTime ? `${post.readingTime} min read` : "Read"}
            </span>
          </div>
        </div>

        <Link href={href}>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
            {post.title}
          </h2>
        </Link>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
          {post.excerpt}
        </p>

        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex flex-wrap gap-1">
            {post.tags.slice(0, 3).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => onTagClick(tag)}
                className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[11px] rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-700 dark:hover:text-blue-300 transition"
              >
                #{tag}
              </button>
            ))}
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            {post.likesCount ?? 0} likes · {post.commentsCount ?? 0} comments
          </div>
        </div>
      </div>
    </article>
  );
}

function SkeletonGrid() {
  return (
    <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden"
        >
          <div className="aspect-3/2 bg-gray-200 dark:bg-gray-700" />
          <div className="p-5">
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
            <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-1" />
            <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
