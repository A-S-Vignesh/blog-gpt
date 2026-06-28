"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import Tags from "../Tags";
import { FaFire, FaHeart, FaComment, FaShareAlt } from "react-icons/fa";
import { getTrendingPosts } from "@/lib/api/trending";
import { useRouter } from "next/navigation";
import TrendingShimmer from "../shimmer/TrendingShimmer";
import { optimizeImage } from "@/lib/images";

const DEFAULT_COVER =
  "https://res.cloudinary.com/ddj4zaxln/image/upload/laptop_hyujfu.png";

export default function TrendingSection() {
  const router = useRouter();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["trending-posts"],
    queryFn: getTrendingPosts,
    staleTime: 1000 * 60 * 3, // 3 minutes caching
  });

  if (isLoading) return <TrendingShimmer />;
  if (isError)
    return <p className="text-red-500">Failed to load trending posts</p>;

  const trendingPosts = data?.posts || [];

  return (
    <div className="mb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="p-2 bg-linear-to-r from-orange-500 to-red-500 rounded-lg mr-3">
            <FaFire className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Trending Now
          </h2>
        </div>
        <Link
          href="/explore"
          className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          View all
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {trendingPosts.map((post: any, index: number) => (
          <Link
            key={post._id}
            className="h-full"
            href={`/${post.creator.username}/${post.slug}`}
          >
            <div
              className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:scale-[1.01] hover:shadow-xl transition h-full flex flex-col ${
                index === 0
                  ? "ring-2 ring-orange-500/50 dark:ring-orange-400/50"
                  : ""
              }`}
            >
              {/* Image — 3:2 across the board. Half-width cells keep the
                  image at a comfortable ~300-400px tall on desktop. */}
              <div className="relative w-full aspect-3/2">
                <Image
                  src={optimizeImage(post.image || DEFAULT_COVER, {
                    width: 800,
                  })}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 45vw, 600px"
                  className="object-cover object-center"
                />
                {index === 0 && (
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-orange-500 text-white text-xs font-semibold inline-flex items-center shadow">
                    <FaFire className="mr-1" /> #1 Trending
                  </div>
                )}
              </div>

              <div className="p-6 flex flex-col grow">
                <Tags tags={post.tags} limit={3} />

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 pt-2">
                  {post.title}
                </h3>

                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-4">
                  {post.excerpt}
                </p>

                <div className="flex items-center justify-between mt-auto pt-4">
                  <button
                    onClick={(e) => {
                      e.preventDefault(); // prevent opening parent link
                      router.push(`/${post.creator.username}`);
                    }}
                    className="flex items-center group text-left"
                  >
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
                      <p className="font-medium text-gray-900 dark:text-white text-sm group-hover:text-blue-600 transition">
                        {post.creator.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {post.readingTime} min read
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-gray-600 dark:text-gray-400 p-2 gap-0.5">
                      <FaHeart className="mr-1" />
                      <span>{post.likesCount}</span>
                    </div>

                    <div className="flex items-center text-gray-600 dark:text-gray-400 p-2">
                      <FaComment className="mr-1" />
                      <span>{post.commentsCount}</span>
                    </div>

                    <FaShareAlt className="text-gray-600 dark:text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
