"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";
import { useToast } from "@/provider/ToastProvider";
import type { AdminAuditPage, AdminAuditRow } from "@/lib/data/admin";

const TABS: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "Posts", value: "post" },
  { label: "Comments", value: "comment" },
  { label: "Users", value: "user" },
  { label: "Messages", value: "message" },
  { label: "Ads", value: "campaign" },
];

/** Destructive actions read red; reversible ones stay neutral. */
const ACTION_STYLES: Record<string, string> = {
  "post.delete": "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
  "comment.delete":
    "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
  "message.delete":
    "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
  "user.ban": "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
  "user.role":
    "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300",
  "ad.reject": "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
  "ad.refund": "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
  "ad.approve":
    "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300",
  "ad.mark_paid":
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  "post.approve":
    "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300",
  "user.unban":
    "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300",
};

const NEUTRAL =
  "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";

/** Render a before/after bag as `key: value` lines without dumping raw JSON. */
function fields(bag: Record<string, unknown> | null) {
  if (!bag) return null;
  const entries = Object.entries(bag);
  if (entries.length === 0) return null;
  return entries.map(([k, v]) => (
    <div key={k} className="flex gap-2">
      <span className="shrink-0 text-gray-500 dark:text-gray-400">{k}:</span>
      <span className="break-all text-gray-900 dark:text-gray-100">
        {typeof v === "object" && v !== null ? JSON.stringify(v) : String(v)}
      </span>
    </div>
  ));
}

export default function AuditTable({
  initial,
  targetType,
}: {
  initial: AdminAuditPage;
  targetType?: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [, startTransition] = useTransition();

  const [rows, setRows] = useState<AdminAuditRow[]>(initial.entries);
  const [skip, setSkip] = useState(initial.entries.length);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [total, setTotal] = useState(initial.total);
  const [loadingMore, setLoadingMore] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function loadMore() {
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({ skip: String(skip), limit: "50" });
      if (targetType) params.set("targetType", targetType);
      const res = await fetch(`/api/admin/audit?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load more entries.");
      const page: AdminAuditPage = await res.json();
      setRows((prev) => [...prev, ...page.entries]);
      setSkip((prev) => prev + page.entries.length);
      setHasMore(page.hasMore);
      setTotal(page.total);
    } catch {
      showToast("Could not load more entries.", "error");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const active = (targetType ?? "") === tab.value;
          return (
            <button
              key={tab.label}
              onClick={() => {
                const params = new URLSearchParams();
                if (tab.value) params.set("targetType", tab.value);
                startTransition(() =>
                  router.push(`/admin/audit?${params.toString()}`),
                );
              }}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                active
                  ? "bg-blue-600 text-white"
                  : "border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
        {total.toLocaleString()} entr{total === 1 ? "y" : "ies"}
      </p>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
          Nothing logged yet. Entries appear here the moment you act on
          something.
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((entry) => {
            const open = expanded.has(entry._id);
            const hasDetail =
              Boolean(entry.before) || Boolean(entry.after) || Boolean(entry.ip);

            return (
              <li
                key={entry._id}
                className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
              >
                <button
                  onClick={() => hasDetail && toggle(entry._id)}
                  className="flex w-full items-start gap-3 p-3 text-left"
                >
                  <span className="mt-1 shrink-0 text-gray-400">
                    {hasDetail ? (
                      open ? (
                        <FaChevronDown />
                      ) : (
                        <FaChevronRight />
                      )
                    ) : (
                      <span className="inline-block w-3.5" />
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="mb-1 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 font-mono text-xs font-semibold ${ACTION_STYLES[entry.action] ?? NEUTRAL}`}
                      >
                        {entry.action}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(entry.createdAt).toLocaleString()}
                      </span>
                    </span>

                    <span className="block truncate text-sm text-gray-900 dark:text-white">
                      {entry.targetLabel || entry.targetId}
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">
                      by {entry.actorEmail}
                      {entry.reason && ` — "${entry.reason}"`}
                    </span>
                  </span>
                </button>

                {open && (
                  <div className="border-t border-gray-100 px-3 py-3 pl-10 font-mono text-xs dark:border-gray-800">
                    {entry.before && (
                      <div className="mb-2">
                        <p className="mb-1 font-semibold text-gray-700 dark:text-gray-300">
                          before
                        </p>
                        {fields(entry.before)}
                      </div>
                    )}
                    {entry.after && (
                      <div className="mb-2">
                        <p className="mb-1 font-semibold text-gray-700 dark:text-gray-300">
                          after
                        </p>
                        {fields(entry.after)}
                      </div>
                    )}
                    <p className="text-gray-500 dark:text-gray-400">
                      target id: {entry.targetId}
                      {entry.ip && ` · ip: ${entry.ip}`}
                    </p>
                  </div>
                )}
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
    </>
  );
}
