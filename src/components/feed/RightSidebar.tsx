"use client";

import { useState } from "react";
import Image from "next/image";
import {
  FaPlus,
  FaRocket,
  FaNewspaper,
  FaLightbulb,
  FaQuestionCircle,
  FaInfoCircle,
} from "react-icons/fa";
import { FaHashtag } from "react-icons/fa6";

const RightSidebar = () => {
  const [followSuggestions, setFollowSuggestions] = useState([
    {
      id: 1,
      name: "Alex Thompson",
      username: "alext",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=AlexT",
      bio: "AI Researcher @DeepMind",
      isFollowing: false,
    },
    {
      id: 2,
      name: "Sarah Chen",
      username: "sarahc",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=SarahC",
      bio: "Full-Stack Developer",
      isFollowing: true,
    },
    {
      id: 3,
      name: "Mike Rodriguez",
      username: "miker",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=MikeR",
      bio: "Tech Writer & Educator",
      isFollowing: false,
    },
  ]);

  const trendingTags = [
    { name: "AI", count: 2543 },
    { name: "WebDevelopment", count: 1892 },
    { name: "JavaScript", count: 1765 },
    { name: "React", count: 1543 },
    { name: "NextJS", count: 1321 },
    { name: "TypeScript", count: 1187 },
    { name: "Startup", count: 987 },
    { name: "Programming", count: 876 },
  ];

  const toggleFollow = (id: number) => {
    setFollowSuggestions((suggestions) =>
      suggestions.map((suggestion) =>
        suggestion.id === id
          ? { ...suggestion, isFollowing: !suggestion.isFollowing }
          : suggestion
      )
    );
  };

  return (
    <div className="space-y-8">
      {/* Who to Follow */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
            <FaRocket className="mr-2 text-blue-600 dark:text-blue-400" />
            Who to Follow
          </h3>
          <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            See all
          </button>
        </div>

        <div className="space-y-4">
          {followSuggestions.map((person) => (
            <div key={person.id} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="relative w-10 h-10 rounded-full overflow-hidden mr-3">
                  <Image
                    src={person.avatar}
                    alt={person.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {person.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    @{person.username}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[120px]">
                    {person.bio}
                  </p>
                </div>
              </div>
              <button
                onClick={() => toggleFollow(person.id)}
                className={`px-3 py-1 text-sm rounded-lg transition ${
                  person.isFollowing
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {person.isFollowing ? "Following" : "Follow"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Popular Tags */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
            <FaHashtag className="mr-2 text-blue-600 dark:text-blue-400" />
            Popular Tags
          </h3>
          <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            View all
          </button>
        </div>

        <div className="space-y-3">
          {trendingTags.map((tag) => (
            <div key={tag.name} className="flex items-center justify-between">
              <button className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition">
                #{tag.name}
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {tag.count.toLocaleString()} posts
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Newsletter */}
      {/* <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="mb-4">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-3">
            <FaNewspaper className="text-xl" />
          </div>
          <h3 className="text-lg font-bold mb-2">Weekly Digest</h3>
          <p className="text-blue-100 text-sm">
            Get the top stories and updates delivered to your inbox every
            Friday.
          </p>
        </div>
        <div className="space-y-3">
          <input
            type="email"
            placeholder="Your email address"
            className="w-full px-4 py-2 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
          />
          <button className="w-full bg-white text-blue-600 font-medium py-2 rounded-lg hover:bg-gray-100 transition">
            Subscribe
          </button>
        </div>
      </div> */}

      {/* AI Tips */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
            <FaLightbulb className="text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            AI Writing Tip
          </h3>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
          Use specific prompts for better results. Instead of "Write about AI",
          try "Write a beginner-friendly guide to machine learning algorithms
          for web developers."
        </p>
        <button className="text-blue-600 dark:text-blue-400 text-sm hover:underline">
          Learn more →
        </button>
      </div>

      {/* Help & Support */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-3">
            <FaQuestionCircle className="text-gray-600 dark:text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Need Help?
          </h3>
        </div>
        <div className="space-y-2">
          <a
            href="#"
            className="block text-gray-600 dark:text-gray-400 text-sm hover:text-blue-600 dark:hover:text-blue-400"
          >
            How to write your first post
          </a>
          <a
            href="#"
            className="block text-gray-600 dark:text-gray-400 text-sm hover:text-blue-600 dark:hover:text-blue-400"
          >
            Using AI to generate content
          </a>
          <a
            href="#"
            className="block text-gray-600 dark:text-gray-400 text-sm hover:text-blue-600 dark:hover:text-blue-400"
          >
            Community guidelines
          </a>
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
