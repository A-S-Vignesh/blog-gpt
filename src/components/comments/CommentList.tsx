"use client";

import { useCallback, useState } from "react";
import { FaComments, FaCommentSlash } from "react-icons/fa";
import { useToast } from "@/provider/ToastProvider";
import CommentForm from "./CommentForm";
import CommentItem from "./CommentItem";
import type { ClientComment } from "@/types/comment";

type Props = {
  username: string;
  slug: string;
  postAuthorId: string;
  isPostOwner?: boolean;
  initialAllowComments?: boolean;
  initialComments: ClientComment[];
  initialCount: number;
  initialNextCursor?: string | null;
};

export default function CommentList({
  username,
  slug,
  postAuthorId,
  isPostOwner = false,
  initialAllowComments = true,
  initialComments,
  initialCount,
  initialNextCursor = null,
}: Props) {
  const { showToast } = useToast();
  const [comments, setComments] = useState<ClientComment[]>(initialComments);
  const [count, setCount] = useState(initialCount);
  const [cursor, setCursor] = useState<string | null>(initialNextCursor);
  const [loading, setLoading] = useState(false);
  const [allowComments, setAllowComments] = useState(initialAllowComments);
  const [togglingComments, setTogglingComments] = useState(false);

  const toggleComments = useCallback(async () => {
    if (togglingComments) return;
    const next = !allowComments;
    setTogglingComments(true);
    // Optimistic — roll back on failure.
    setAllowComments(next);
    try {
      const res = await fetch(`/api/post/${username}/${slug}/comment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowComments: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data?.error || "Could not update comment settings");
      }
      setAllowComments(Boolean(data.allowComments));
      showToast(
        data.allowComments ? "Comments turned on." : "Comments turned off.",
        "success",
      );
    } catch (err: any) {
      setAllowComments(!next);
      showToast(err?.message || "Could not update comment settings", "error");
    } finally {
      setTogglingComments(false);
    }
  }, [allowComments, togglingComments, username, slug, showToast]);

  const loadMore = useCallback(async () => {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/post/${username}/${slug}/comment?cursor=${encodeURIComponent(cursor)}&limit=20`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not load comments");
      setComments((prev) => [...prev, ...(data.data as ClientComment[])]);
      setCursor(data.nextCursor ?? null);
    } catch (err: any) {
      showToast(err?.message || "Failed to load more comments", "error");
    } finally {
      setLoading(false);
    }
  }, [cursor, loading, username, slug, showToast]);

  const handlePosted = useCallback((newComment: ClientComment) => {
    // Roots go to the top, replies don't appear here (CommentItem owns them).
    if (!newComment.parentCommentId) {
      setComments((prev) => [newComment, ...prev]);
    }
    setCount((c) => c + 1);
  }, []);

  const handleReplyPosted = useCallback(() => {
    setCount((c) => c + 1);
  }, []);

  const handleDeleted = useCallback((id: string) => {
    setComments((prev) => prev.filter((c) => c._id !== id));
    setCount((c) => Math.max(0, c - 1));
  }, []);

  return (
    <section
      id="comments"
      aria-label="Comments"
      className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 scroll-mt-24"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
          <FaComments className="text-blue-600 dark:text-blue-400" />
          Comments
          <span className="text-base font-normal text-gray-500 dark:text-gray-400">
            ({count.toLocaleString()})
          </span>
        </h2>

        {isPostOwner && (
          <button
            type="button"
            onClick={toggleComments}
            disabled={togglingComments}
            aria-pressed={allowComments}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60"
          >
            {allowComments ? (
              <>
                <FaCommentSlash /> Turn off comments
              </>
            ) : (
              <>
                <FaComments /> Turn on comments
              </>
            )}
          </button>
        )}
      </div>

      {allowComments ? (
        <div className="mb-8">
          <CommentForm username={username} slug={slug} onPosted={handlePosted} />
        </div>
      ) : (
        <div className="mb-8 flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4 text-sm text-gray-600 dark:text-gray-300">
          <FaCommentSlash className="shrink-0" />
          {isPostOwner
            ? "Comments are turned off. Existing comments stay visible; turn them back on to allow new ones."
            : "The author has turned off comments for this post."}
        </div>
      )}

      {comments.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm italic py-6 text-center">
          Be the first to comment.
        </p>
      ) : (
        <div>
          {comments.map((c) => (
            <CommentItem
              key={c._id}
              comment={c}
              username={username}
              slug={slug}
              postAuthorId={postAuthorId}
              commentsEnabled={allowComments}
              onDeleted={handleDeleted}
              onReplyPosted={handleReplyPosted}
            />
          ))}
        </div>
      )}

      {cursor && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60"
          >
            {loading ? "Loading…" : "Load more comments"}
          </button>
        </div>
      )}
    </section>
  );
}
