"use client";

import { useState } from "react";
import Image from "next/image";
import {
  FaHeart,
  FaComment,
  FaBookmark,
  FaShareAlt,
  FaRegClock,
  FaFire,
} from "react-icons/fa";

const RecentPosts = () => {
  const [posts, setPosts] = useState([
    {
      id: 1,
      title: "Understanding React Server Components",
      excerpt:
        "A deep dive into the new paradigm of server-side rendering in React 18 and how it changes everything.",
      author: {
        name: "Emma Davis",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
        username: "emmad",
      },
      readTime: "7 min read",
      date: "3 hours ago",
      tags: ["React", "Next.js", "RSC"],
      likes: 156,
      comments: 24,
      isBookmarked: false,
      isLiked: false,
    },
    {
      id: 2,
      title: "The Rise of AI-Powered Development Tools",
      excerpt:
        "How AI assistants are transforming the way developers write and debug code.",
      author: {
        name: "David Wilson",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
        username: "davidw",
      },
      readTime: "6 min read",
      date: "6 hours ago",
      tags: ["AI", "Development", "Tools"],
      likes: 198,
      comments: 35,
      isBookmarked: true,
      isLiked: true,
    },
    {
      id: 3,
      title: "Building Microservices with Node.js",
      excerpt:
        "A practical guide to designing and implementing microservices architecture using Node.js.",
      author: {
        name: "Lisa Brown",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa",
        username: "lisab",
      },
      readTime: "10 min read",
      date: "1 day ago",
      tags: ["Node.js", "Microservices", "Backend"],
      likes: 224,
      comments: 42,
      isBookmarked: false,
      isLiked: false,
    },
    {
      id: 4,
      title: "The Future of Web3 Development",
      excerpt:
        "Exploring the tools and frameworks shaping the next generation of decentralized applications.",
      author: {
        name: "James Wilson",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=James",
        username: "jamesw",
      },
      readTime: "8 min read",
      date: "2 days ago",
      tags: ["Web3", "Blockchain", "DApps"],
      likes: 178,
      comments: 29,
      isBookmarked: false,
      isLiked: false,
    },
  ]);

  const toggleLike = (id: number) => {
    setPosts((posts) =>
      posts.map((post) =>
        post.id === id
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );
  };

  const toggleBookmark = (id: number) => {
    setPosts((posts) =>
      posts.map((post) =>
        post.id === id ? { ...post, isBookmarked: !post.isBookmarked } : post
      )
    );
  };

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
        <button className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
          See more
        </button>
      </div>

      <div className="space-y-6">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex flex-col md:flex-row gap-6">
              {/* Post Content */}
              <div className="flex-1">
                {/* Author Info */}
                <div className="flex items-center mb-4">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden mr-3">
                    <Image
                      src={post.author.avatar}
                      alt={post.author.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {post.author.name}
                      </p>
                      {post.id === 1 && (
                        <span className="ml-2 px-2 py-0.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs rounded-full flex items-center">
                          <FaFire className="mr-1" /> Trending
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {post.date} • {post.readTime}
                    </p>
                  </div>
                </div>

                {/* Title and Excerpt */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 hover:text-blue-600 dark:hover:text-blue-400 transition">
                  {post.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {post.excerpt}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Engagement Stats */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => toggleLike(post.id)}
                      className={`flex items-center ${
                        post.isLiked
                          ? "text-red-500 dark:text-red-400"
                          : "text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                      }`}
                    >
                      <FaHeart className="mr-1" />
                      <span className="text-sm">{post.likes}</span>
                    </button>
                    <button className="flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400">
                      <FaComment className="mr-1" />
                      <span className="text-sm">{post.comments}</span>
                    </button>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => toggleBookmark(post.id)}
                      className={`p-2 rounded-lg ${
                        post.isBookmarked
                          ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <FaBookmark />
                    </button>
                    <button className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                      <FaShareAlt />
                    </button>
                  </div>
                </div>
              </div>

              {/* Featured Image (Desktop) */}
              <div className="hidden md:block w-48 h-48 relative rounded-xl overflow-hidden shrink-0">
                <Image
                  src={`https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80&seed=${post.id}`}
                  alt={post.title}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      <div className="text-center mt-8">
        <button className="px-6 py-3 border-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 font-medium rounded-xl hover:bg-blue-50 dark:hover:bg-gray-800 transition">
          Load More Posts
        </button>
      </div>
    </div>
  );
};

export default RecentPosts;
