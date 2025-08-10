"use client";

import Image from "next/image";
import Link from "next/link";
import {
  FaUser,
  FaEnvelope,
  FaPencilAlt,
  FaTwitter,
  FaLinkedin,
  FaGithub,
  FaCalendarAlt,
  FaQuoteLeft,
  FaEdit,
  FaAt,
  FaChartLine,
} from "react-icons/fa";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import React, { use, useState } from "react";
import BlogPost from "./BlogPost";
import { useEffect } from "react";
import LoadingSkeleton from "@/components/LoadingSkeleton";

const ViewProfile = ({ isMyProfile, data, userPosts }) => {
  const [userData, setUserData] = useState(data);
  // const [showApiKey, setShowApiKey] = useState(false);
  const [errorState, setErrorState] = useState({
    isError: false,
    message: "",
  });
  const [loading, setLoading] = useState(false);
  console.log(userData)

  return (
    <>
      <section className="py-16 px-6 sm:px-16 md:px-20 lg:px-28 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            {isMyProfile ? "Your" : `${userData?.name||userData?.username}`}{" "}
            <span className="text-blue-600 dark:text-blue-400">Profile</span>
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
            {isMyProfile
              ? "Manage your profile and showcase your work"
              : "Explore content created by this author"}
          </p>
        </div>
      </section>
      <section className="min-h-screen px-6 sm:px-16 md:px-20 lg:px-28 py-8 sm:py-10 bg-white dark:bg-dark-100">
        <div className="max-w-6xl mx-auto">
          {/* Profile Card */}
          <div className="bg-white dark:bg-dark-100 rounded-2xl shadow-lg overflow-hidden mb-12 border-2 border-gray-200 dark:border-gray-700">
            <div className="relative">
              {/* Profile Banner */}
              <div className="h-40 bg-gradient-to-r from-blue-500 to-purple-600"></div>

              {/* Profile Content */}
              <div className="px-6 pb-8 sm:px-10">
                {/* Profile Image */}
                <div className="relative -mt-20 mb-6">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 mx-auto bg-white dark:bg-dark-100 rounded-full p-1 shadow-lg">
                    <div className="relative h-full w-full rounded-full overflow-hidden border-4 border-white dark:border-dark-100">
                      <Image
                        src={
                          userData?.image || "/assets/images/default-avatar.png"
                        }
                        alt="profile image"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                </div>

                {/* Profile Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Left Column - Personal Info */}
                  <div className="md:col-span-1">
                    <div className="text-center md:text-left">
                      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                        {userData?.name || "Anonymous User"}
                      </h2>
                      <div className="flex items-center justify-center md:justify-start text-blue-600 dark:text-blue-400 mb-4">
                        <FaAt className="mr-1" />
                        <span className="font-medium">
                          {userData?.username}
                        </span>
                      </div>

                      <div className="space-y-4 mb-6">
                        <div className="flex items-center">
                          <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg mr-3">
                            <FaEnvelope className="text-gray-600 dark:text-gray-400" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Email
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {userData?.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg mr-3">
                            <FaPencilAlt className="text-gray-600 dark:text-gray-400" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Posts
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {userPosts?.length || 0}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg mr-3">
                            <FaCalendarAlt className="text-gray-600 dark:text-gray-400" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Joined
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {new Date(userData?.createdAt).toLocaleDateString(
                                "en-US",
                                { month: "long", year: "numeric" }
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column - Bio */}
                  <div className="md:col-span-2">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 h-full">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                          <FaQuoteLeft className="mr-2 text-blue-600 dark:text-blue-400" />
                          Bio
                        </h3>
                        {isMyProfile && (
                          <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition">
                            <FaEdit />
                          </button>
                        )}
                      </div>

                      <div className="text-gray-700 dark:text-gray-300">
                        {userData?.bio ? (
                          <p>{userData.bio}</p>
                        ) : (
                          <div className="italic text-gray-500 dark:text-gray-400">
                            {isMyProfile
                              ? "You haven't added a bio yet. Tell others about yourself!"
                              : "This user hasn't added a bio yet."}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Social Links */}
                <div className="flex justify-center gap-4 mt-8 mb-6">
                  <a
                    href={userData?.socials?.twitter || "#"}
                    target="_blank"
                    className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800 transition"
                  >
                    <FaTwitter size={18} />
                  </a>
                  <a
                    href={userData?.socials?.linkedin || "#"}
                    target="_blank"
                    className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800 transition"
                  >
                    <FaLinkedin size={18} />
                  </a>
                  <a
                    href={userData?.socials?.github || "#"}
                    target="_blank"
                    className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800 transition"
                  >
                    <FaGithub size={18} />
                  </a>
                </div>

                {isMyProfile && (
                  <div className="flex justify-center gap-4">
                    <Link
                      href={"/settings"}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
                    >
                      Edit Profile
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Error Message */}
            {errorState.isError && (
              <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-4 mb-6 mx-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-600 dark:text-red-400"
                      fill="none"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                      Error
                    </h3>
                    <div className="mt-1 text-sm text-red-700 dark:text-red-300">
                      <p>{errorState.message}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Blog Posts Section */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <FaPencilAlt className="mr-3 text-blue-600 dark:text-blue-400" />
                {isMyProfile ? "Your Blog Posts" : "Published Content"}
              </h2>
              {isMyProfile && (
                <Link
                  href="/post/create"
                  className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
                >
                  <FaPencilAlt className="mr-2" />
                  Create New Post
                </Link>
              )}
            </div>

            {userPosts && userPosts.length < 1 ? (
              <div className="bg-gray-50 dark:bg-dark-100 rounded-2xl p-12 text-center border-2 border-gray-200 dark:border-gray-700">
                <div className="mx-auto w-24 h-24 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                  <FaPencilAlt className="text-3xl text-gray-400 dark:text-gray-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  No Posts Yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  {isMyProfile
                    ? "You haven't created any blog posts yet. Start sharing your ideas with the world!"
                    : "This user hasn't published any content yet."}
                </p>
                {isMyProfile && (
                  <div className="mt-6">
                    <Link
                      href="/post/create"
                      className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition"
                    >
                      Create Your First Post
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {userPosts
                  ?.slice()
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((post) => (
                    <BlogPost key={post._id} {...post} />
                  ))}
              </div>
            )}
          </div>

          {/* Stats Section */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-2xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <FaChartLine className="mr-3 text-blue-600 dark:text-blue-400" />
              Engagement Statistics
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-dark-100 rounded-xl p-6 shadow-sm">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  5.2K
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  Total Views
                </div>
              </div>

              <div className="bg-white dark:bg-dark-100 rounded-xl p-6 shadow-sm">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  1.8K
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  Total Reads
                </div>
              </div>

              <div className="bg-white dark:bg-dark-100 rounded-xl p-6 shadow-sm">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  324
                </div>
                <div className="text-gray-600 dark:text-gray-400">Comments</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ViewProfile;
