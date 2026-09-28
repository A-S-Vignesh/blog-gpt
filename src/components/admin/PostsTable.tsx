"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import {
  FaCheck,
  FaFlag,
  FaEyeSlash,
  FaTrash,
  FaSearch,
  FaExternalLinkAlt,
} from "react-icons/fa";
import { useToast } from "@/provider/ToastProvider";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { AdminPostPage, AdminPostRow } from "@/lib/data/admin";

type Filter = {
  moderationStatus?: "pending" | "approved" | "flagged";
  status?: "draft" | "published" | "archived";
  q?: string;
};

const MODERATION_STYLES: Record<string, string> = {
  flagged:
    "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
  pending:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  approved:
    "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300",
};

const STATUS_STYLES: Record<string, string> = {
  published:
    "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  archived:
    "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300",
};

function Badge({ text, styles }: { text: string; styles: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${styles}`}
    >
      {text}
    </span>
  );
}

export default function PostsTable({
  initial,
  filter,
}: {
  initial: AdminPostPage;
  filter: Filter;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [, startTransition] = useTransition();

  const [rows, setRows] = useState<AdminPostRow[]>(initial.posts);
  const [skip, setSkip] = useState(initial.posts.length);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [total, setTotal] = useState(initial.total);
  const [loadingMore, setLoadingMore] = useState(false);
  // Per-row busy flag, so acting on one post doesn't freeze the whole table.
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminPostRow | null>(null);
  const [search, setSearch] = useState(filter.q ?? "");

  /** Push a filter change into the URL so the view is shareable/bookmarkable. */
  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => router.push(`/admin/posts?${params.toString()}`));
  }

  function queryString(nextSkip: number) {
    const params = new URLSearchParams();
    if (filter.moderationStatus)
      params.set("moderationStatus", filter.moderationStatus);
    if (filter.status) params.set("status", filter.status);
    if (filter.q) params.set("q", filter.q);
    params.set("skip", String(nextSkip));
    params.set("limit", "25");
    return params.toString();
  }

  async function loadMore() {
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/admin/posts?${queryString(skip)}`);
      if (!res.ok) throw new Error("Failed to load more posts.");
      const page: AdminPostPage = await res.json();
      setRows((prev) => [...prev, ...page.posts]);
      setSkip((prev) => prev + page.posts.length);
      setHasMore(page.hasMore);
      setTotal(page.total);
    } catch {
      showToast("Could not load more posts.", "error");
    } finally {
      setLoadingMore(false);
    }
  }

  async function moderate(
    post: AdminPostRow,
    action: "approve" | "flag" | "unpublish",
  ) {
    setBusyId(post._id);
    try {
      const res = await fetch(`/api/admin/posts/${post._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Action failed.");

      // Update the row in place rather than refetching — the admin is usually
      // working down a queue and a full reload would lose their scroll spot.
      setRows((prev) =>
        prev.map((r) =>
          r._id === post._id
            ? {
                ...r,
                moderationStatus:
                  action === "approve" ? "approved" : "flagged",
                status: action === "unpublish" ? "draft" : r.status,
              }
            : r,
        ),
      );
      showToast(
        action === "approve"
          ? "Post approved."
          : action === "flag"
            ? "Post flagged."
            : "Post unpublished.",
        "success",
      );
      // Refresh the server layout so the sidebar's flagged badge stays honest.
      router.refresh();
    } catch (err: any) {
      showToast(err?.message || "Action failed.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const post = pendingDelete;
    setBusyId(post._id);
    try {
      const res = await fetch(`/api/admin/posts/${post._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Delete failed.");

      setRows((prev) => prev.filter((r) => r._id !== post._id));
      setTotal((t) => Math.max(0, t - 1));
      showToast("Post deleted.", "success");
      router.refresh();
    } catch (err: any) {
      showToast(err?.message || "Delete failed.", "error");
    } finally {
      setBusyId(null);
      setPendingDelete(null);
    }
  }

  return (
    <>
      {/* ── FILTERS ──────────────────────────────────────────────────── */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setParam("q", search.trim());
          }}
          className="relative flex-1"
        >
          <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search post titles…"
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
        </form>

        <select
          value={filter.moderationStatus ?? ""}
          onChange={(e) => setParam("moderationStatus", e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        >
          <option value="">All moderation</option>
          <option value="flagged">Flagged</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
        </select>

        <select
          value={filter.status ?? ""}
          onChange={(e) => setParam("status", e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        >
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
        {total.toLocaleString()} post{total === 1 ? "" : "s"}
      </p>

      {/* ── ROWS ─────────────────────────────────────────────────────── */}
      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
          No posts match this filter.
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((post) => {
            const busy = busyId === post._id;
            return (
              <li
                key={post._id}
                className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Badge
                        text={post.moderationStatus}
                        styles={
                          MODERATION_STYLES[post.moderationStatus] ??
                          MODERATION_STYLES.pending
                        }
                      />
                      <Badge
                        text={post.status}
                        styles={
                          STATUS_STYLES[post.status] ?? STATUS_STYLES.draft
                        }
                      />
                    </div>

                    <h3 className="truncate font-semibold text-gray-900 dark:text-white">
                      {post.title || "(untitled)"}
                    </h3>

                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {post.author ? (
                        <>
                          by {post.author.name} (@{post.author.username}) ·{" "}
                          {post.author.email}
                        </>
                      ) : (
                        "author deleted"
                      )}{" "}
                      · {new Date(post.createdAt).toLocaleDateString()} ·{" "}
                      {post.views} views · {post.likesCount} likes ·{" "}
                      {post.commentsCount} comments
                    </p>

                    {post.moderationReason && (
                      <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
                        <strong>Reason:</strong> {post.moderationReason}
                        {post.moderationCategories.length > 0 && (
                          <> · {post.moderationCategories.join(", ")}</>
                        )}
                      </p>
                    )}
                  </div>

                  {post.author && (
                    <Link
                      href={`/${post.author.username}/${post.slug}`}
                      target="_blank"
                      className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline"
                    >
                      View <FaExternalLinkAlt className="text-[10px]" />
                    </Link>
                  )}
                </div>

                {/* ── ACTIONS ─────────────────────────────────────────── */}
                <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                  <button
                    disabled={busy || post.moderationStatus === "approved"}
                    onClick={() => moderate(post, "approve")}
                    className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <FaCheck /> Approve
                  </button>
                  <button
                    disabled={busy || post.moderationStatus === "flagged"}
                    onClick={() => moderate(post, "flag")}
                    className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <FaFlag /> Flag
                  </button>
                  <button
                    disabled={busy || post.status !== "published"}
                    onClick={() => moderate(post, "unpublish")}
                    className="flex items-center gap-1.5 rounded-lg bg-gray-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <FaEyeSlash /> Unpublish
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => setPendingDelete(post)}
                    className="ml-auto flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900 dark:hover:bg-red-950/40"
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              </li>
            );
          })}
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
        title="Delete this post permanently?"
        description={
          <>
            <strong>{pendingDelete?.title}</strong> and all of its comments,
            likes, bookmarks, shares, and view records will be removed. The
            cover image is deleted from Cloudinary too. This cannot be undone —
            only the audit log will remember it.
          </>
        }
        confirmLabel="Delete post"
        variant="danger"
        loading={busyId !== null && busyId === pendingDelete?._id}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
