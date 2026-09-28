"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import {
  FaSearch,
  FaBan,
  FaUndo,
  FaCog,
  FaExternalLinkAlt,
  FaShieldAlt,
  FaExclamationTriangle,
} from "react-icons/fa";
import { useToast } from "@/provider/ToastProvider";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { AdminUserPage, AdminUserRow } from "@/lib/data/admin";

type Filter = {
  q?: string;
  role?: "admin" | "author" | "user";
  plan?: "free" | "pro" | "business";
  state?: "banned" | "deleting";
};

const ROLE_STYLES: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300",
  author: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  user: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const PLAN_STYLES: Record<string, string> = {
  free: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  pro: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  business:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
};

/** A ban or role change the admin has asked for but not yet confirmed. */
type Pending =
  | { kind: "ban"; user: AdminUserRow; reason: string }
  | { kind: "role"; user: AdminUserRow; role: "admin" | "author" | "user" };

export default function UsersTable({
  initial,
  filter,
  actorId,
}: {
  initial: AdminUserPage;
  filter: Filter;
  actorId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [, startTransition] = useTransition();

  const [rows, setRows] = useState<AdminUserRow[]>(initial.users);
  const [skip, setSkip] = useState(initial.users.length);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [total, setTotal] = useState(initial.total);
  const [loadingMore, setLoadingMore] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [search, setSearch] = useState(filter.q ?? "");
  // Draft credit values, keyed by user id, so typing in one row doesn't
  // re-render or clobber another.
  const [creditDraft, setCreditDraft] = useState<Record<string, string>>({});

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => router.push(`/admin/users?${params.toString()}`));
  }

  async function loadMore() {
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({ skip: String(skip), limit: "25" });
      if (filter.q) params.set("q", filter.q);
      if (filter.role) params.set("role", filter.role);
      if (filter.plan) params.set("plan", filter.plan);
      if (filter.state) params.set("state", filter.state);
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load more users.");
      const page: AdminUserPage = await res.json();
      setRows((prev) => [...prev, ...page.users]);
      setSkip((prev) => prev + page.users.length);
      setHasMore(page.hasMore);
      setTotal(page.total);
    } catch {
      showToast("Could not load more users.", "error");
    } finally {
      setLoadingMore(false);
    }
  }

  /** Single funnel for every mutation, so error handling is written once. */
  async function mutate(
    user: AdminUserRow,
    body: Record<string, unknown>,
    patch: Partial<AdminUserRow>,
    successMessage: string,
  ) {
    setBusyId(user._id);
    try {
      const res = await fetch(`/api/admin/users/${user._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Update failed.");

      setRows((prev) =>
        prev.map((r) => (r._id === user._id ? { ...r, ...patch } : r)),
      );
      showToast(successMessage, "success");
      router.refresh();
    } catch (err: any) {
      showToast(err?.message || "Update failed.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmPending() {
    if (!pending) return;
    if (pending.kind === "ban") {
      await mutate(
        pending.user,
        { action: "ban", reason: pending.reason },
        { banned: true, bannedReason: pending.reason || "Banned by admin." },
        "Account banned.",
      );
    } else {
      await mutate(
        pending.user,
        { action: "role", role: pending.role },
        { role: pending.role },
        `Role changed to ${pending.role}.`,
      );
    }
    setPending(null);
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
            placeholder="Search name, @username, or email…"
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
        </form>

        <select
          value={filter.role ?? ""}
          onChange={(e) => setParam("role", e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        >
          <option value="">All roles</option>
          <option value="admin">Admin</option>
          <option value="author">Author</option>
          <option value="user">User</option>
        </select>

        <select
          value={filter.plan ?? ""}
          onChange={(e) => setParam("plan", e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        >
          <option value="">All plans</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="business">Business</option>
        </select>

        <select
          value={filter.state ?? ""}
          onChange={(e) => setParam("state", e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        >
          <option value="">Any state</option>
          <option value="banned">Banned</option>
          <option value="deleting">Pending deletion</option>
        </select>
      </div>

      <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
        {total.toLocaleString()} user{total === 1 ? "" : "s"}
      </p>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
          No users match this filter.
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((user) => {
            const busy = busyId === user._id;
            const isSelf = user._id === actorId;
            const open = openId === user._id;

            return (
              <li
                key={user._id}
                className={`rounded-xl border bg-white p-4 dark:bg-gray-900 ${
                  user.banned
                    ? "border-red-300 dark:border-red-900/60"
                    : "border-gray-200 dark:border-gray-800"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ROLE_STYLES[user.role] ?? ROLE_STYLES.user}`}
                      >
                        {user.role}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PLAN_STYLES[user.plan] ?? PLAN_STYLES.free}`}
                      >
                        {user.plan}
                        {user.planStatus !== "active" && ` · ${user.planStatus}`}
                      </span>
                      {user.banned && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-950/50 dark:text-red-300">
                          banned
                        </span>
                      )}
                      {user.deletionScheduledFor && (
                        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700 dark:bg-orange-950/50 dark:text-orange-300">
                          deleting{" "}
                          {new Date(
                            user.deletionScheduledFor,
                          ).toLocaleDateString()}
                        </span>
                      )}
                      {isSelf && (
                        <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                          you
                        </span>
                      )}
                    </div>

                    <h3 className="truncate font-semibold text-gray-900 dark:text-white">
                      {user.name}{" "}
                      <span className="font-normal text-gray-500 dark:text-gray-400">
                        @{user.username}
                      </span>
                    </h3>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {user.email} · joined{" "}
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {user.postsCount} posts · {user.followersCount} followers ·{" "}
                      AI used {user.aiGenerationCount}
                      {user.aiExtraCredits > 0 &&
                        ` · +${user.aiExtraCredits} extra credits`}
                      {user.hasGeminiKey && " · own Gemini key"}
                    </p>

                    {user.banned && user.bannedReason && (
                      <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
                        <strong>Ban reason:</strong> {user.bannedReason}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <Link
                      href={`/${user.username.toLowerCase()}`}
                      target="_blank"
                      className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline"
                    >
                      Profile <FaExternalLinkAlt className="text-[10px]" />
                    </Link>
                    <button
                      onClick={() => setOpenId(open ? null : user._id)}
                      className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      <FaCog /> {open ? "Close" : "Manage"}
                    </button>
                  </div>
                </div>

                {/* ── MANAGE PANEL ────────────────────────────────────── */}
                {open && (
                  <div className="mt-4 grid gap-4 border-t border-gray-100 pt-4 sm:grid-cols-3 dark:border-gray-800">
                    {/* Role */}
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Role
                      </label>
                      <select
                        value={user.role}
                        disabled={busy || isSelf}
                        onChange={(e) =>
                          setPending({
                            kind: "role",
                            user,
                            role: e.target.value as "admin" | "author" | "user",
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 outline-none focus:border-blue-500 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="user">user</option>
                        <option value="author">author</option>
                        <option value="admin">admin</option>
                      </select>
                      {isSelf && (
                        <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                          You can&apos;t change your own role.
                        </p>
                      )}
                    </div>

                    {/* Plan */}
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Plan
                      </label>
                      <select
                        value={user.plan}
                        disabled={busy}
                        onChange={(e) =>
                          mutate(
                            user,
                            { action: "plan", plan: e.target.value },
                            { plan: e.target.value },
                            `Plan set to ${e.target.value}.`,
                          )
                        }
                        className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 outline-none focus:border-blue-500 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="free">free</option>
                        <option value="pro">pro</option>
                        <option value="business">business</option>
                      </select>
                      <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                        Manual override. Does not touch Razorpay billing.
                      </p>
                    </div>

                    {/* Credits */}
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Extra AI credits
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min={0}
                          max={100000}
                          value={
                            creditDraft[user._id] ?? String(user.aiExtraCredits)
                          }
                          onChange={(e) =>
                            setCreditDraft((d) => ({
                              ...d,
                              [user._id]: e.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                        <button
                          disabled={busy}
                          onClick={() => {
                            const raw =
                              creditDraft[user._id] ??
                              String(user.aiExtraCredits);
                            const value = Number(raw);
                            if (!Number.isInteger(value) || value < 0) {
                              showToast(
                                "Credits must be a whole number of 0 or more.",
                                "error",
                              );
                              return;
                            }
                            mutate(
                              user,
                              { action: "credits", aiExtraCredits: value },
                              { aiExtraCredits: value },
                              "Credits updated.",
                            );
                          }}
                          className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                        >
                          Save
                        </button>
                      </div>
                      <button
                        disabled={busy}
                        onClick={() =>
                          mutate(
                            user,
                            {
                              action: "credits",
                              aiExtraCredits: user.aiExtraCredits,
                              resetUsage: true,
                            },
                            { aiGenerationCount: 0 },
                            "Monthly usage reset.",
                          )
                        }
                        className="mt-1 text-[11px] text-blue-600 hover:underline disabled:opacity-50"
                      >
                        Reset this month&apos;s usage ({user.aiGenerationCount})
                      </button>
                    </div>

                    {/* Ban */}
                    <div className="sm:col-span-3">
                      {user.banned ? (
                        <button
                          disabled={busy}
                          onClick={() =>
                            mutate(
                              user,
                              { action: "unban" },
                              { banned: false, bannedReason: "" },
                              "Account restored.",
                            )
                          }
                          className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                        >
                          <FaUndo /> Unban account
                        </button>
                      ) : (
                        <button
                          disabled={busy || isSelf || user.role === "admin"}
                          onClick={() =>
                            setPending({ kind: "ban", user, reason: "" })
                          }
                          className="flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900 dark:hover:bg-red-950/40"
                        >
                          <FaBan /> Ban account
                        </button>
                      )}
                      {!user.banned && user.role === "admin" && !isSelf && (
                        <p className="mt-1 flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                          <FaShieldAlt /> Demote to user first, then ban.
                        </p>
                      )}
                    </div>
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

      <ConfirmDialog
        open={pending?.kind === "ban"}
        title="Ban this account?"
        description={
          pending?.kind === "ban" ? (
            <>
              <strong>{pending.user.email}</strong> will be refused at sign-in
              and their existing session is revoked within 5 minutes. Their
              posts and comments stay published — unpublish those separately if
              they need to go.
              <input
                autoFocus
                value={pending.reason}
                onChange={(e) =>
                  setPending({ ...pending, reason: e.target.value })
                }
                placeholder="Reason (recorded in the audit log)"
                className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </>
          ) : null
        }
        confirmLabel="Ban account"
        variant="danger"
        loading={busyId !== null}
        onConfirm={confirmPending}
        onCancel={() => setPending(null)}
      />

      <ConfirmDialog
        open={pending?.kind === "role"}
        title={
          pending?.kind === "role" && pending.role === "admin"
            ? "Grant full admin access?"
            : "Change this user's role?"
        }
        description={
          pending?.kind === "role" ? (
            pending.role === "admin" ? (
              <span className="flex gap-2">
                <FaExclamationTriangle className="mt-0.5 shrink-0 text-amber-500" />
                <span>
                  <strong>{pending.user.email}</strong> will be able to ban
                  accounts, delete any post, and change plans — everything you
                  can do. Only do this for someone you trust completely.
                </span>
              </span>
            ) : (
              <>
                <strong>{pending.user.email}</strong> will be set to{" "}
                <strong>{pending.role}</strong>. If they are currently an admin,
                they lose panel access within 5 minutes.
              </>
            )
          ) : null
        }
        confirmLabel={
          pending?.kind === "role" && pending.role === "admin"
            ? "Grant admin"
            : "Change role"
        }
        variant="danger"
        loading={busyId !== null}
        onConfirm={confirmPending}
        onCancel={() => setPending(null)}
      />
    </>
  );
}
