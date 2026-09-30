"use client";

import { useCallback, useEffect, useState } from "react";
import { FaComments, FaCommentSlash, FaTimes } from "react-icons/fa";
import { useToast } from "@/provider/ToastProvider";
import CommentForm from "./CommentForm";
import CommentItem from "./CommentItem";
import type { ClientComment } from "@/types/comment";

type LinkedComment = {
  comment: ClientComment;
  parent: { _id: string; username: string | null; content: string } | null;
};

const COMMENT_HASH = /^#comment-([a-f0-9]{24})$/i;
/** How long a deep-linked comment stays highlighted. */
const HIGHLIGHT_MS = 4000;

type Props = {
  username: string;
  slug: string;
  /** Used to check that a deep-linked comment belongs to this post. */
  postId?: string;
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
  postId,
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
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [linked, setLinked] = useState<LinkedComment | null>(null);

  // Deep link to one comment (`#comment-<id>`, e.g. from a notification).
  // If it's already on the page, scroll to it. If not (an older comment past
  // the first page, or a reply in a collapsed thread), fetch it on its own
  // and pin it above the list.
  useEffect(() => {
    let cancelled = false;

    async function focusFromHash() {
      const match = COMMENT_HASH.exec(window.location.hash);
      if (!match) return;
      const id = match[1].toLowerCase();

      const el = document.getElementById(`comment-${id}`);
      if (el) {
        setHighlightId(id);
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      try {
        const res = await fetch(`/api/comment/${id}`);
        const data = (await res.json().catch(() => null)) as LinkedComment | null;
        if (cancelled) return;
        if (
          !res.ok ||
          !data?.comment ||
          (postId && String(data.comment.postId) !== postId)
        ) {
          showToast("That comment is no longer available.", "info");
          return;
        }
        setLinked(data);
        setHighlightId(id);
      } catch {
        if (!cancelled) {
          showToast("Couldn't load the linked comment.", "error");
        }
      }
    }

    void focusFromHash();
    window.addEventListener("hashchange", focusFromHash);
    return () => {
      cancelled = true;
      window.removeEventListener("hashchange", focusFromHash);
    };
  }, [postId, showToast]);

  // Scroll to the pinned comment once it has rendered.
  useEffect(() => {
    if (!linked) return;
    document
      .getElementById(`comment-${linked.comment._id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [linked]);

  // Let the highlight fade once the reader has found the comment.
  useEffect(() => {
    if (!highlightId) return;
    const t = setTimeout(() => setHighlightId(null), HIGHLIGHT_MS);
    return () => clearTimeout(t);
  }, [highlightId]);

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

      {linked && (
        <div className="mb-6 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 px-4 pt-3">
          <div className="flex items-center justify-between gap-3 text-xs font-semibold text-blue-700 dark:text-blue-300">
            <span>
              {linked.parent
                ? `Linked reply${
                    linked.parent.username
                      ? ` to @${linked.parent.username}`
                      : ""
                  }`
                : "Linked comment"}
            </span>
            <button
              type="button"
              onClick={() => setLinked(null)}
              aria-label="Dismiss linked comment"
              className="p-1 rounded-md text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40"
            >
              <FaTimes />
            </button>
          </div>
          {linked.parent?.content && (
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 line-clamp-2 border-l-2 border-gray-300 dark:border-gray-700 pl-3">
              {linked.parent.content}
            </p>
          )}
          <CommentItem
            comment={linked.comment}
            username={username}
            slug={slug}
            postAuthorId={postAuthorId}
            commentsEnabled={allowComments}
            highlightedId={highlightId}
            onDeleted={(id) => {
              setLinked(null);
              handleDeleted(id);
            }}
            onReplyPosted={handleReplyPosted}
          />
        </div>
      )}

      {comments.length === 0 && allowComments ? (
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
              highlightedId={highlightId}
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
