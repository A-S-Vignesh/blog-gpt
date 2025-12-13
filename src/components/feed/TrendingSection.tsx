"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
// import TrendingShimmer from "../shimmer/TrendingShimmer";
import Tags from "../Tags";
import { FaFire, FaHeart, FaComment, FaShareAlt } from "react-icons/fa";
import { getTrendingPosts } from "@/lib/api/trending";
import { useRouter } from "next/navigation";
import TrendingShimmer from "../shimmer/TrendingShimmer";

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
          href="/explore/trending"
          className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          View all
        </Link>
      </div>

      {/* Trending Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {trendingPosts.map((post: any, index: number) => (
          <Link
            key={post._id}
            className={`${index === 0 ? "md:col-span-2" : ""} h-full`}
            href={`/${post.creator.username}/${post.slug}`}
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:scale-[1.01] hover:shadow-xl transition h-full flex flex-col">
              {/* Image */}
              <div className={`relative ${index === 0 ? "h-64" : "h-48"}`}>
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover"
                />
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
