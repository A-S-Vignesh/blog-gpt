"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FaTrash, FaSearch, FaExternalLinkAlt } from "react-icons/fa";
import { useToast } from "@/provider/ToastProvider";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { AdminCommentPage, AdminCommentRow } from "@/lib/data/admin";

export default function CommentsTable({
  initial,
  q,
}: {
  initial: AdminCommentPage;
  q?: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [, startTransition] = useTransition();

  const [rows, setRows] = useState<AdminCommentRow[]>(initial.comments);
  const [skip, setSkip] = useState(initial.comments.length);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [total, setTotal] = useState(initial.total);
  const [loadingMore, setLoadingMore] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminCommentRow | null>(
    null,
  );
  const [search, setSearch] = useState(q ?? "");

  async function loadMore() {
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({ skip: String(skip), limit: "25" });
      if (q) params.set("q", q);
      const res = await fetch(`/api/admin/comments?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load more comments.");
      const page: AdminCommentPage = await res.json();
      setRows((prev) => [...prev, ...page.comments]);
      setSkip((prev) => prev + page.comments.length);
      setHasMore(page.hasMore);
      setTotal(page.total);
    } catch {
      showToast("Could not load more comments.", "error");
    } finally {
      setLoadingMore(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const comment = pendingDelete;
    setBusyId(comment._id);
    try {
      const res = await fetch(`/api/admin/comments/${comment._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Delete failed.");

      const removed: number = data?.deleted ?? 1;
      setRows((prev) => prev.filter((r) => r._id !== comment._id));
      setTotal((t) => Math.max(0, t - removed));
      showToast(
        removed > 1
          ? `Comment and ${removed - 1} repl${removed - 1 === 1 ? "y" : "ies"} deleted.`
          : "Comment deleted.",
        "success",
      );
    } catch (err: any) {
      showToast(err?.message || "Delete failed.", "error");
    } finally {
      setBusyId(null);
      setPendingDelete(null);
    }
  }

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const params = new URLSearchParams();
          if (search.trim()) params.set("q", search.trim());
          startTransition(() =>
            router.push(`/admin/comments?${params.toString()}`),
          );
        }}
        className="relative mb-4"
      >
        <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search comment text…"
          className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        />
      </form>

      <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
        {total.toLocaleString()} comment{total === 1 ? "" : "s"}
      </p>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
          No comments match this search.
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((comment) => (
            <li
              key={comment._id}
              className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {comment.author ? (
                      <>
                        {comment.author.name} (@{comment.author.username})
                      </>
                    ) : (
                      "author deleted"
                    )}{" "}
                    · {new Date(comment.createdAt).toLocaleString()}
                  </p>
                  {/* Plain text, never dangerouslySetInnerHTML — comment bodies
                      are raw user input and this panel must not become the one
                      place they get rendered as markup. */}
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-900 dark:text-gray-100">
                    {comment.content}
                  </p>
                  {comment.postSlug && (
                    <Link
                      href={`/post/${comment.postSlug}`}
                      target="_blank"
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline"
                    >
                      Open post <FaExternalLinkAlt className="text-[10px]" />
                    </Link>
                  )}
                </div>

                <button
                  disabled={busyId === comment._id}
                  onClick={() => setPendingDelete(comment)}
                  aria-label="Delete comment"
                  className="shrink-0 rounded-lg border border-red-300 p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-40 dark:border-red-900 dark:hover:bg-red-950/40"
                >
                  <FaTrash />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loadingMore}
          className="mx-auto mt-6 block rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {loadingMore ? "Loading…" : "Load more"}
        </button>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this comment?"
        description="The comment and every reply beneath it will be removed permanently. The post's comment count is adjusted automatically."
        confirmLabel="Delete"
        variant="danger"
        loading={busyId !== null && busyId === pendingDelete?._id}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
