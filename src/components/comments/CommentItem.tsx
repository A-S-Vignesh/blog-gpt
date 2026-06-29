"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FaReply,
  FaTrash,
  FaChevronDown,
  FaChevronUp,
  FaSpinner,
} from "react-icons/fa";
import { useSession } from "next-auth/react";
import { useToast } from "@/provider/ToastProvider";
import { timeAgo } from "@/utils/timeAgo";
import type { ClientComment } from "@/types/comment";
import CommentForm from "./CommentForm";

type Props = {
  comment: ClientComment;
  username: string;
  slug: string;
  postAuthorId: string;
  commentsEnabled?: boolean;
  onDeleted: (id: string) => void;
  onReplyPosted: (reply: ClientComment) => void;
};

const MAX_VISIBLE_DEPTH = 4;
const REPLIES_PAGE_SIZE = 50;

export default function CommentItem({
  comment,
  username,
  slug,
  postAuthorId,
  commentsEnabled = true,
  onDeleted,
  onReplyPosted,
}: Props) {
  const { data: session } = useSession();
  const { showToast } = useToast();

  const [replying, setReplying] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Replies are LAZY-loaded from the server on first expand.
  const [replies, setReplies] = useState<ClientComment[]>([]);
  const [repliesLoaded, setRepliesLoaded] = useState(false);
  const [repliesExpanded, setRepliesExpanded] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);

  // Track reply count locally so optimistic post/delete keeps the UI in sync.
  const [replyCount, setReplyCount] = useState(comment.replyCount ?? 0);

  const myId = session?.user?._id;
  const myRole = (session?.user as any)?.role;
  const isMine = myId && myId === comment.userId._id;
  const isPostAuthor = myId && myId === postAuthorId;
  const isAdmin = myRole === "admin";
  const canDelete = Boolean(isMine || isPostAuthor || isAdmin);

  const depth = comment.depth ?? 0;
  const canReply = depth < MAX_VISIBLE_DEPTH && commentsEnabled;

  async function loadReplies() {
    if (loadingReplies) return;
    setLoadingReplies(true);
    try {
      const res = await fetch(
        `/api/post/${username}/${slug}/comment?parent=${comment._id}&limit=${REPLIES_PAGE_SIZE}`,
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Could not load replies.");
      }
      setReplies(data.data as ClientComment[]);
      setRepliesLoaded(true);
      setRepliesExpanded(true);
    } catch (err: any) {
      showToast(err?.message || "Failed to load replies", "error");
    } finally {
      setLoadingReplies(false);
    }
  }

  function handleToggleReplies() {
    if (!repliesLoaded) {
      void loadReplies();
      return;
    }
    setRepliesExpanded((v) => !v);
  }

  async function handleDelete() {
    if (!canDelete || deleting) return;
    if (!confirm("Delete this comment? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/comment/${comment._id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Delete failed");
      }
      onDeleted(comment._id);
    } catch (err: any) {
      showToast(err?.message || "Could not delete comment", "error");
    } finally {
      setDeleting(false);
    }
  }

  async function handleReplyPosted(reply: ClientComment) {
    setReplyCount((c) => c + 1);
    setReplying(false);
    onReplyPosted(reply);

    if (repliesLoaded) {
      // We already have the server's reply list — append the new one
      // (replies are sorted oldest-first, so new replies go at the end).
      setReplies((prev) => [...prev, reply]);
      setRepliesExpanded(true);
    } else {
      // Replies haven't been fetched yet — pull the full list from the
      // server so we don't hide existing replies someone else posted.
      // The new reply will already be in the server response.
      await loadReplies();
    }
  }

  function handleReplyDeleted(id: string) {
    setReplies((prev) => prev.filter((r) => r._id !== id));
    setReplyCount((c) => Math.max(0, c - 1));
  }

  const repliesIndent =
    depth < MAX_VISIBLE_DEPTH
      ? "pl-4 border-l-2 border-gray-100 dark:border-gray-800"
      : "";

  return (
    <div className="flex gap-3 py-4 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
      <Link
        href={`/${comment.userId.username}`}
        className="shrink-0"
        aria-label={`${comment.userId.name}'s profile`}
      >
        <div className="relative w-9 h-9 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
          <Image
            src={comment.userId.image || "/assets/images/default-avatar.png"}
            alt={comment.userId.name}
            fill
            sizes="36px"
            className="object-cover"
          />
        </div>
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2 mb-1">
          <Link
            href={`/${comment.userId.username}`}
            className="font-semibold text-gray-900 dark:text-white text-sm hover:underline"
          >
            {comment.userId.name}
          </Link>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            @{comment.userId.username}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">·</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {timeAgo(comment.createdAt)}
          </span>
          {comment.isEdited && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              (edited)
            </span>
          )}
        </div>

        <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
          {comment.content}
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
          {canReply && (
            <button
              type="button"
              onClick={() => setReplying((v) => !v)}
              className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <FaReply /> Reply
            </button>
          )}

          {replyCount > 0 && (
            <button
              type="button"
              onClick={handleToggleReplies}
              disabled={loadingReplies}
              className="inline-flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-60"
              aria-expanded={repliesExpanded}
            >
              {loadingReplies ? (
                <>
                  <FaSpinner className="animate-spin" /> Loading…
                </>
              ) : repliesExpanded ? (
                <>
                  <FaChevronUp /> Hide {replyCount}{" "}
                  {replyCount === 1 ? "reply" : "replies"}
                </>
              ) : (
                <>
                  <FaChevronDown /> View {replyCount}{" "}
                  {replyCount === 1 ? "reply" : "replies"}
                </>
              )}
            </button>
          )}

          {canDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1 hover:text-red-600 disabled:opacity-50"
            >
              <FaTrash /> {deleting ? "Deleting…" : "Delete"}
            </button>
          )}
        </div>

        {replying && (
          <div className="mt-3">
            <CommentForm
              username={username}
              slug={slug}
              parentCommentId={comment._id}
              placeholder={`Reply to @${comment.userId.username}…`}
              autoFocus
              onPosted={handleReplyPosted}
              onCancel={() => setReplying(false)}
            />
          </div>
        )}

        {repliesExpanded && replies.length > 0 && (
          <div className={`mt-3 ${repliesIndent}`}>
            {replies.map((reply) => (
              <CommentItem
                key={reply._id}
                comment={reply}
                username={username}
                slug={slug}
                postAuthorId={postAuthorId}
                commentsEnabled={commentsEnabled}
                onDeleted={(id) => {
                  handleReplyDeleted(id);
                  // Also notify the post-level count.
                  onDeleted(id);
                }}
                onReplyPosted={onReplyPosted}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
