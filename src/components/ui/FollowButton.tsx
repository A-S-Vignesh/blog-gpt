"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { FaUserPlus, FaUserCheck } from "react-icons/fa";
import { useToast } from "@/provider/ToastProvider";

const DEBOUNCE_MS = 400;

export default function FollowButton({
  targetUsername,
  initialFollowing,
  initialFollowersCount,
  className,
}: {
  targetUsername: string;
  initialFollowing: boolean;
  initialFollowersCount: number;
  className?: string;
}) {
  const { showToast } = useToast();
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const [following, setFollowing] = useState(initialFollowing);
  const [count, setCount] = useState(initialFollowersCount);

  const pendingRef = useRef(initialFollowing);
  const serverRef = useRef(initialFollowing);
  const inflightRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // API is idempotent — we send the desired state, server SETs it and
  // returns the authoritative follower count from the Follow collection.
  const lastServerCountRef = useRef(initialFollowersCount);
  const flush = useCallback(
    async (desired: boolean) => {
      if (inflightRef.current) return;
      if (desired === serverRef.current) return;
      inflightRef.current = true;
      try {
        const res = await fetch(`/api/user/${targetUsername}/follow`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ following: desired }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || "Follow failed");
        }
        const confirmed = Boolean(data.following);
        serverRef.current = confirmed;
        setFollowing(confirmed);
        // Trust the server-returned count fully — it's a fresh
        // `countDocuments` call on the Follow collection.
        if (typeof data.followersCount === "number") {
          lastServerCountRef.current = data.followersCount;
          setCount(data.followersCount);
        }
      } catch (err: any) {
        // Rollback to the last confirmed server state.
        setFollowing(serverRef.current);
        setCount(lastServerCountRef.current);
        pendingRef.current = serverRef.current;
        showToast(err?.message || "Could not update follow", "error");
      } finally {
        inflightRef.current = false;
        if (pendingRef.current !== serverRef.current) {
          flush(pendingRef.current);
        }
      }
    },
    [targetUsername, showToast],
  );

  const handleClick = useCallback(() => {
    if (status === "unauthenticated") {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }
    if (status === "loading") return;

    const next = !pendingRef.current;
    pendingRef.current = next;
    setFollowing(next);
    setCount((c) => (next ? c + 1 : Math.max(0, c - 1)));

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => flush(next), DEBOUNCE_MS);
  }, [flush, pathname, router, status]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return (
    <div className="inline-flex items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        aria-label={following ? "Unfollow" : "Follow"}
        aria-pressed={following}
        className={
          className ??
          `inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
            following
              ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-300 border border-gray-200 dark:border-gray-700"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`
        }
      >
        {following ? (
          <>
            <FaUserCheck /> Following
          </>
        ) : (
          <>
            <FaUserPlus /> Follow
          </>
        )}
      </button>
      <span className="text-sm text-gray-500 dark:text-gray-400 tabular-nums">
        {count.toLocaleString()} {count === 1 ? "follower" : "followers"}
      </span>
    </div>
  );
}
