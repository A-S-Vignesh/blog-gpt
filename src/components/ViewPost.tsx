"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import PostDate from "@/components/Date";
import Tags from "@/components/Tags";

import { BsThreeDotsVertical } from "react-icons/bs";
import { useSession } from "next-auth/react";
import { MdDelete, MdEdit } from "react-icons/md";
import { FaComment, FaShareAlt } from "react-icons/fa";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getRequest } from "@/utils/requestHandler";

import { useDispatch } from "react-redux";
import { PopulatedClientPost } from "@/types/post";
import RelatedPosts from "./RelatedPosts";
import LikeButton from "./ui/LikeButton";
import BookmarkButton from "./ui/BookmarkButton";
import ConfirmDialog from "./ui/ConfirmDialog";
import ShareDialog from "./ui/ShareDialog";
import type { ShareChannel } from "@/lib/share";
import { formatShareCount } from "@/lib/share";
import CommentList from "./comments/CommentList";
import type { ClientComment } from "@/types/comment";
import { useToast } from "@/provider/ToastProvider";
import { sanitizeForRender } from "@/utils/sanitizeHtmlForRender";
// import { postActions } from "@/redux/slice/post";
// import { getRequest } from "@/utils/requestHandlers";

interface ViewPostProps {
  post: PopulatedClientPost;
  relatedPosts: PopulatedClientPost[];
  user?: {
    _id: string;
  };
  initialLiked?: boolean;
  initialBookmarked?: boolean;
  initialComments?: ClientComment[];
}

const ViewPost: React.FC<ViewPostProps> = ({
  post,
  relatedPosts,
  user,
  initialLiked = false,
  initialBookmarked = false,
  initialComments = [],
}) => {
  const { showToast } = useToast();
  const [threedotModel, setThreedotModel] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const dispatch = useDispatch();

  // Share state. URL has to be built client-side because we need the live
  // origin (matches the canonical the post page redirects to — see
  // src/app/(app)/[username]/[slug]/page.tsx).
  const [shareUrl, setShareUrl] = useState("");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareCount, setShareCount] = useState(post.sharesCount ?? 0);
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
    // Canonical share URL — always lowercase username + slug, so the link a
    // reader pastes elsewhere matches the URL Google indexes. Stripping
    // query/hash means a `#comments` deeplink doesn't leak into shares.
    const usernameLc = post.creator.username.toLowerCase();
    setShareUrl(
      `${window.location.origin}/${usernameLc}/${post.slug}`,
    );
  }, [post.creator.username, post.slug]);

  // Fire-and-forget share tracking. Updates the optimistic count from the
  // server's authoritative number; failures are silent because the user
  // already shared and we don't want to nag them about analytics.
  const trackShare = React.useCallback(
    async (channel: ShareChannel) => {
      setShareCount((c) => c + 1);
      try {
        const res = await fetch(
          `/api/post/${post.creator.username}/${post.slug}/share`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ channel }),
          },
        );
        const data = await res.json().catch(() => ({}));
        if (typeof data?.sharesCount === "number") {
          setShareCount(data.sharesCount);
        }
      } catch {
        // Swallow — see comment above.
      }
    },
    [post.creator.username, post.slug],
  );

  useEffect(() => {
    const key = `viewed-${post._id}`;
    const lastView = localStorage.getItem(key);

    // 12 hours limit
    const shouldCount =
      !lastView || Date.now() - Number(lastView) > 12 * 60 * 60 * 1000;

    if (shouldCount) {
      if (post.creator?.username) {
        fetch(`/api/post/${post.creator.username}/${post.slug}/view`, { method: "POST" }).catch(() => {});
      }
      localStorage.setItem(key, Date.now().toString());
    }
  }, [post._id, post.slug, post.creator?.username]);

  const deletePost = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/post/${post.creator.username}/${post.slug}`,
        { method: "DELETE" },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Could not delete this post.");
      }
      showToast("Post deleted.", "success");
      setConfirmDeleteOpen(false);
      router.push("/post");
      router.refresh();
    } catch (err: any) {
      showToast(err?.message || "Failed to delete post.", "error");
      setLoading(false);
    }
  };

  return (
    <section className="app pb-4 sm:pb-8 bg-white dark:bg-dark-100 px-2 md:px-4">
      <div className="w-full max-w-6xl mx-auto">
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
                      href={`/${post.creator.username}/${post?.slug}/edit`}
                      className="w-full flex items-center gap-2 text-left font-semibold text-black hover:text-slate-700 dark:text-white dark:hover:text-slate-300"
                    >
                      <MdEdit /> Edit
                    </Link>
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setThreedotModel(false);
                          setConfirmDeleteOpen(true);
                        }}
                        className="w-full flex items-center gap-2 text-left font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 cursor-pointer"
                      >
                        <MdDelete /> Delete
                      </button>
                    </li>
                  </>
                )}

                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setThreedotModel(false);
                      setShareDialogOpen(true);
                    }}
                    className="w-full flex items-center gap-2 text-left font-semibold text-black hover:text-slate-700 dark:text-white dark:hover:text-slate-300 hover:cursor-pointer"
                  >
                    <FaShareAlt /> Share
                  </button>
                </li>
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
                  {post.creator.name || post.creator.username}
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
              initialLiked={initialLiked}
              initialCount={post.likesCount}
              postSlug={post.slug}
              username={post.creator.username}
              isAuthenticated={!!user?._id}
            />

            {/* COMMENT LINK — smooth-scrolls to the comments section */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById("comments");
                if (!el) return;
                el.scrollIntoView({ behavior: "smooth", block: "start" });
                // Keep the URL hash in sync so users can copy/share the deep link.
                history.replaceState(null, "", "#comments");
              }}
              className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-blue-500 transition cursor-pointer"
              aria-label="Scroll to comments"
            >
              <FaComment />
              <span>{post.commentsCount}</span>
            </button>

            {/* BOOKMARK BUTTON */}
            <BookmarkButton
              postSlug={post.slug}
              username={post.creator.username}
              initialBookmarked={initialBookmarked}
            />

            {/* SHARE BUTTON — always opens the dialog, even on mobile. The
                dialog itself surfaces "Share via device" when the OS sheet
                is available. */}
            <button
              type="button"
              onClick={() => setShareDialogOpen(true)}
              className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-green-500 transition"
              aria-label="Share post"
            >
              <FaShareAlt />
              {shareCount > 0 && (
                <span className="text-sm font-semibold tabular-nums">
                  {formatShareCount(shareCount)}
                </span>
              )}
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
              "https://res.cloudinary.com/ddj4zaxln/image/upload/laptop_hyujfu.png"
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
          dangerouslySetInnerHTML={{
            __html: sanitizeForRender(post?.content || ""),
          }}
        />

        {/* slogan */}
        {post?.slug && (
          <div className="bg-[#F6F6F7] dark:bg-[#242535] mt-8 dark:text-white border-l-4 text-black p-4 rounded-lg text-center capitalize text-lg font-semibold">
            {post?.slug}
          </div>
        )}
        <RelatedPosts posts={relatedPosts} />

        <CommentList
          username={post.creator.username}
          slug={post.slug}
          postAuthorId={
            typeof post.creator === "string"
              ? post.creator
              : (post.creator as any)._id || ""
          }
          isPostOwner={
            !!user?._id &&
            user._id ===
              (typeof post.creator === "string"
                ? post.creator
                : (post.creator as any)._id)
          }
          initialAllowComments={post.allowComments !== false}
          initialComments={initialComments}
          initialCount={post.commentsCount}
        />
      </div>

      <ShareDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        url={shareUrl}
        title={post.title}
        text={post.excerpt}
        onShared={trackShare}
      />

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete this post?"
        description={
          <>
            <p>
              You&apos;re about to permanently delete{" "}
              <strong className="font-semibold text-gray-900 dark:text-white">
                &ldquo;{post.title}&rdquo;
              </strong>
              .
            </p>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              This will also remove all comments and likes on this post. This
              action cannot be undone.
            </p>
          </>
        }
        confirmLabel="Delete post"
        cancelLabel="Keep post"
        variant="danger"
        loading={loading}
        onConfirm={deletePost}
        onCancel={() => {
          if (!loading) setConfirmDeleteOpen(false);
        }}
      />
    </section>
  );
};

export default ViewPost;
