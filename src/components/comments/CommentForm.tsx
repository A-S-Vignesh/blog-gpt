"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/provider/ToastProvider";
import type { ClientComment } from "@/types/comment";

const MAX_LENGTH = 1000;

export default function CommentForm({
  username,
  slug,
  parentCommentId,
  placeholder = "Add a comment…",
  autoFocus = false,
  onPosted,
  onCancel,
}: {
  username: string;
  slug: string;
  parentCommentId?: string;
  placeholder?: string;
  autoFocus?: boolean;
  onPosted: (comment: ClientComment) => void;
  onCancel?: () => void;
}) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();

  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (status === "unauthenticated") {
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-900 text-sm text-gray-600 dark:text-gray-300">
        <Link
          href={`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`}
          className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
        >
          Sign in
        </Link>{" "}
        to join the conversation.
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed.length === 0 || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/post/${username}/${slug}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: trimmed,
          parentCommentId: parentCommentId ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Could not post comment");
      }
      setValue("");
      onPosted(data as ClientComment);
      if (parentCommentId) onCancel?.();
    } catch (err: any) {
      showToast(err?.message || "Failed to post comment", "error");
    } finally {
      setSubmitting(false);
    }
  }

  const length = value.trim().length;
  const overLimit = length > MAX_LENGTH;
  const canSubmit = length > 0 && !overLimit && !submitting && status === "authenticated";

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        rows={parentCommentId ? 2 : 3}
        maxLength={MAX_LENGTH + 200}
        className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-100 p-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
      />
      <div className="flex items-center justify-between">
        <span
          className={`text-xs ${
            overLimit
              ? "text-red-500"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {length}/{MAX_LENGTH}
        </span>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-sm rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!canSubmit}
            className="px-4 py-1.5 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting
              ? "Posting…"
              : parentCommentId
                ? "Reply"
                : "Post comment"}
          </button>
        </div>
      </div>
    </form>
  );
}
