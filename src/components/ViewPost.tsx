"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import PostDate from "@/components/Date";
import Tags from "@/components/Tags";

import { BsThreeDotsVertical } from "react-icons/bs";
import { useSession } from "next-auth/react";
import { MdDelete, MdEdit } from "react-icons/md";
import { FaBookmark, FaComment, FaShare, FaShareAlt } from "react-icons/fa";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getRequest } from "@/utils/requestHandler";

import {
  EmailIcon,
  EmailShareButton,
  FacebookIcon,
  FacebookShareButton,
  WhatsappIcon,
  WhatsappShareButton,
} from "react-share";
import { useDispatch } from "react-redux";
import { PopulatedClientPost } from "@/types/post";
import RelatedPosts from "./RelatedPosts";
import LikeButton from "./ui/LikeButton";
import { useToast } from "@/provider/ToastProvider";
// import { postActions } from "@/redux/slice/post";
// import { getRequest } from "@/utils/requestHandlers";

interface ViewPostProps {
  post: PopulatedClientPost;
  relatedPosts: PopulatedClientPost[];
  user?: {
    _id: string;
  };
}

interface ShareData {
  title: string;
  url: string;
}

const ViewPost: React.FC<ViewPostProps> = ({ post, relatedPosts, user }) => {
  const { showToast } = useToast();
  const [threedotModel, setThreedotModel] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const [shareUrl, setShareUrl] = useState<ShareData>({
    title: "Check out this interesting post!",
    url: "",
  });
  //get the login user data
  const router = useRouter();
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setThreedotModel(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setShareUrl((prev) => ({
      ...prev,
      url: window.location.href, // ✅ safe in client components
    }));
  }, []);

  useEffect(() => {
    const key = `viewed-${post._id}`;
    const lastView = localStorage.getItem(key);

    // 12 hours limit
    const shouldCount =
      !lastView || Date.now() - Number(lastView) > 12 * 60 * 60 * 1000;

    if (shouldCount) {
      fetch(`/api/post/${post.slug}/view`, { method: "POST" }).catch(() => {});
      localStorage.setItem(key, Date.now().toString());
    }
  }, [post._id]);

  const deletePost = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/post/${post.creator._id}/${post.slug}`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        router.push("/post");
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <section className="app center pb-4 sm:pb-8  bg-white dark:bg-dark-100">
      <div className="w-full max-w-7xl 2xl:max-w-[85%] mx-auto px-2 md:px-4">
        {/* tags */}
        <div className="flex justify-between  items-center">
          <div className="w-full flex flex-wrap justify-start my-4">
            <Tags tags={post?.tags} />
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              name="threedot"
              onClick={() => setThreedotModel((prev) => !prev)}
              className="ml-4 threedot"
              aria-label="More options menu"
            >
              <BsThreeDotsVertical className="w-6 h-6 dark:text-white hover:cursor-pointer" />
            </button>

            {threedotModel && (
              <ul className="absolute right-0 w-40 p-4 bg-slate-200 dark:bg-black border-2 dark:border-slate-800 flex flex-col gap-3 rounded-md z-10">
                {/* Owner actions */}
                {user?._id ===
                  (typeof post?.creator === "string"
                    ? post.creator
                    : post?.creator._id) && (
                  <>
                    <Link
                      href={`/${post.creator._id}/${post?.slug}/edit`}
                      className="w-full flex items-center gap-2 text-left font-semibold text-black hover:text-slate-700 dark:text-white dark:hover:text-slate-300"
                    >
                      <MdEdit /> Edit
                    </Link>
                    <li
                      onClick={deletePost}
                      className="w-full flex items-center gap-2 text-left font-semibold text-black hover:text-slate-700 dark:text-white dark:hover:text-slate-300 cursor-pointer"
                    >
                      <MdDelete /> Delete
                    </li>
                  </>
                )}

                <li>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      // toast.success("Link copied to clipboard!");
                      showToast("Link copied to clipboard!", "success");
                    }}
                    className="w-full flex items-center gap-2 text-left font-semibold text-black hover:text-slate-700 dark:text-white dark:hover:text-slate-300 hover:cursor-pointer"
                  >
                    <FaShare /> Share
                  </button>
                </li>

                <div className="flex justify-between gap-2">
                  <FacebookShareButton
                    title={shareUrl.title}
                    url={shareUrl.url}
                  >
                    <FacebookIcon size={32} round />
                  </FacebookShareButton>
                  <WhatsappShareButton
                    title={shareUrl.title}
                    url={shareUrl.url}
                  >
                    <WhatsappIcon size={32} round />
                  </WhatsappShareButton>
                  <EmailShareButton title={shareUrl.title} url={shareUrl.url}>
                    <EmailIcon size={32} round />
                  </EmailShareButton>
                </div>
              </ul>
            )}
          </div>
        </div>

        {/* title */}

        <h1 className="font-bold capitalize text-[#181A2A] dark:text-white text-3xl sm:text-4xl mb-4 w-full text-left">
          {post?.title}
        </h1>

        {/* Date */}
        <div className="text-left w-full">
          <PostDate date={post?.date} creator={post?.creator} />
        </div>
        {/* --- AUTHOR HEADER + ACTIONS --- */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 mb-6">
          {/* LEFT: AUTHOR INFO */}
          <div className="flex items-center gap-3">
            <Link
              href={`/${post.creator.username}`}
              className="flex items-center gap-3 group"
            >
              <div className="relative w-12 h-12 rounded-full overflow-hidden border border-gray-300 dark:border-gray-700">
                <Image
                  src={
                    post.creator.image || "/assets/images/default-avatar.png"
                  }
                  alt={post.creator.name}
                  fill
                  className="object-cover group-hover:scale-105 transition"
                />
              </div>

              <div>
                <p className="text-base font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 transition">
                  {post.creator.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  @{post.creator.username}
                </p>
              </div>
            </Link>
          </div>

          {/* RIGHT: ACTION BUTTONS */}
          <div className="flex items-center gap-5 mt-4 sm:mt-0">
            {/* LIKE BUTTON */}
            <LikeButton
              initialLiked={post.likes.includes(user?._id || "")}
              initialCount={post.likesCount}
              postSlug={post.slug}
              username={post.creator.username}
            />

            {/* COMMENT LINK */}
            <a
              href="#comments"
              className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-blue-500 transition"
            >
              <FaComment />
              <span>{post.commentsCount}</span>
            </a>

            {/* BOOKMARK BUTTON */}
            <button
              // onClick={handleBookmark}
              className="flex items-center text-gray-600 dark:text-gray-300 hover:text-yellow-500 transition"
            >
              <FaBookmark />
            </button>

            {/* SHARE BUTTON */}
            <button
              onClick={() => navigator.share?.({ url: window.location.href })}
              className="flex items-center text-gray-600 dark:text-gray-300 hover:text-green-500 transition"
            >
              <FaShareAlt />
            </button>
          </div>
        </div>
        {/* image */}
        <div
          className="relative w-full m-auto rounded-md overflow-hidden
                sm:w-[400px] h-72
                md:h-80
                lg:h-[400px] lg:max-w-[80%]"
        >
          <Image
            alt="post image"
            src={
              post?.image ??
              "https://res.cloudinary.com/ddj4zaxln/image/upload/laptop_hyujfu.jpg"
            }
            fill
            sizes="
            (max-width: 640px) 100vw,
            (max-width: 1024px) 400px,
            80vw
          "
            className={`object-contain rounded-md object-center ${
              !post?.image ? "skeloten_loading" : ""
            }`}
          />
        </div>

        {/* paragraph */}
        <div
          className="para para-page mt-6 sm:mt-10 prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: post?.content || "" }}
        />

        {/* slogan */}
        {post?.slug && (
          <div className="bg-[#F6F6F7] dark:bg-[#242535] mt-8 dark:text-white border-l-4 text-black p-4 rounded-lg text-center capitalize text-lg font-semibold">
            {post?.slug}
          </div>
        )}
        <RelatedPosts posts={relatedPosts} />
      </div>
    </section>
  );
};

export default ViewPost;
