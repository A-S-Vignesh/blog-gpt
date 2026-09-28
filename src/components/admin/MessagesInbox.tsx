"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FaTrash, FaReply, FaEnvelopeOpen, FaCheck } from "react-icons/fa";
import { useToast } from "@/provider/ToastProvider";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { AdminMessagePage, AdminMessageRow } from "@/lib/data/admin";

type Status = "new" | "read" | "replied";

const TABS: { label: string; value: Status | "" }[] = [
  { label: "All", value: "" },
  { label: "New", value: "new" },
  { label: "Read", value: "read" },
  { label: "Replied", value: "replied" },
];

const STATUS_STYLES: Record<Status, string> = {
  new: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
  read: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  replied:
    "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300",
};

export default function MessagesInbox({
  initial,
  status,
}: {
  initial: AdminMessagePage;
  status?: Status;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [, startTransition] = useTransition();

  const [rows, setRows] = useState<AdminMessageRow[]>(initial.messages);
  const [skip, setSkip] = useState(initial.messages.length);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [total, setTotal] = useState(initial.total);
  const [loadingMore, setLoadingMore] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminMessageRow | null>(
    null,
  );

  function switchTab(value: Status | "") {
    const params = new URLSearchParams();
    if (value) params.set("status", value);
    startTransition(() => router.push(`/admin/messages?${params.toString()}`));
  }

  async function loadMore() {
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({ skip: String(skip), limit: "25" });
      if (status) params.set("status", status);
      const res = await fetch(`/api/admin/messages?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load more messages.");
      const page: AdminMessagePage = await res.json();
      setRows((prev) => [...prev, ...page.messages]);
      setSkip((prev) => prev + page.messages.length);
      setHasMore(page.hasMore);
      setTotal(page.total);
    } catch {
      showToast("Could not load more messages.", "error");
    } finally {
      setLoadingMore(false);
    }
  }

  async function setStatus(message: AdminMessageRow, next: Status) {
    setBusyId(message._id);
    try {
      const res = await fetch(`/api/admin/messages/${message._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Update failed.");

      setRows((prev) =>
        prev.map((r) => (r._id === message._id ? { ...r, status: next } : r)),
      );
      // Keeps the sidebar's unread badge in step with the list.
      router.refresh();
    } catch (err: any) {
      showToast(err?.message || "Update failed.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const message = pendingDelete;
    setBusyId(message._id);
    try {
      const res = await fetch(`/api/admin/messages/${message._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Delete failed.");

      setRows((prev) => prev.filter((r) => r._id !== message._id));
      setTotal((t) => Math.max(0, t - 1));
      showToast("Message deleted.", "success");
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
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const active = (status ?? "") === tab.value;
          return (
            <button
              key={tab.label}
              onClick={() => switchTab(tab.value)}
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
        {total.toLocaleString()} message{total === 1 ? "" : "s"}
      </p>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
          Nothing here.
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((message) => {
            const busy = busyId === message._id;
            return (
              <li
                key={message._id}
                className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[message.status]}`}
                  >
                    {message.status}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(message.createdAt).toLocaleString()}
                  </span>
                </div>

                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {message.subject}
                </h3>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {message.name} ·{" "}
                  <a
                    href={`mailto:${message.email}?subject=Re: ${encodeURIComponent(message.subject)}`}
                    className="text-blue-600 hover:underline"
                  >
                    {message.email}
                  </a>
                </p>

                <p className="mt-3 whitespace-pre-wrap break-words text-sm text-gray-800 dark:text-gray-200">
                  {message.message}
                </p>

                <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                  <a
                    href={`mailto:${message.email}?subject=Re: ${encodeURIComponent(message.subject)}`}
                    onClick={() => {
                      // Opening the mail client is the closest signal we have
                      // that a reply was actually sent, so mark it here rather
                      // than making the admin remember a second click.
                      if (message.status !== "replied") {
                        void setStatus(message, "replied");
                      }
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                  >
                    <FaReply /> Reply by email
                  </a>
                  <button
                    disabled={busy || message.status === "read"}
                    onClick={() => setStatus(message, "read")}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <FaEnvelopeOpen /> Mark read
                  </button>
                  <button
                    disabled={busy || message.status === "replied"}
                    onClick={() => setStatus(message, "replied")}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <FaCheck /> Mark replied
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => setPendingDelete(message)}
                    className="ml-auto flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-40 dark:border-red-900 dark:hover:bg-red-950/40"
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
        title="Delete this message?"
        description="The enquiry is removed permanently. The sender's address and subject stay in the audit log."
        confirmLabel="Delete"
        variant="danger"
        loading={busyId !== null && busyId === pendingDelete?._id}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
