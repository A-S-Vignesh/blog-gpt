"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { FaBookmark, FaRegBookmark } from "react-icons/fa";
import { useToast } from "@/provider/ToastProvider";

const DEBOUNCE_MS = 400;

export default function BookmarkButton({
  postSlug,
  username,
  initialBookmarked,
  className,
}: {
  postSlug: string;
  username: string;
  initialBookmarked: boolean;
  className?: string;
}) {
  const { showToast } = useToast();
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [bump, setBump] = useState(false);

  const pendingRef = useRef(initialBookmarked);
  const serverRef = useRef(initialBookmarked);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflightRef = useRef(false);

  // API is idempotent — we send the desired state, server SETs it.
  const flush = useCallback(
    async (desired: boolean) => {
      if (inflightRef.current) return;
      if (desired === serverRef.current) return;
      inflightRef.current = true;
      try {
        const res = await fetch(
          `/api/post/${username}/${postSlug}/bookmark`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bookmarked: desired }),
          },
        );
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || "Bookmark failed");
        }
        const confirmed = Boolean(data.bookmarked);
        serverRef.current = confirmed;
        setBookmarked(confirmed);
        showToast(
          confirmed ? "Saved to your bookmarks" : "Removed from bookmarks",
          "success",
        );
      } catch (err: any) {
        setBookmarked(serverRef.current);
        pendingRef.current = serverRef.current;
        showToast(err?.message || "Could not update bookmark", "error");
      } finally {
        inflightRef.current = false;
        if (pendingRef.current !== serverRef.current) {
          flush(pendingRef.current);
        }
      }
    },
    [postSlug, username, showToast],
  );

  const handleClick = useCallback(() => {
    if (status === "unauthenticated") {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }
    if (status === "loading") return;

    const next = !pendingRef.current;
    pendingRef.current = next;
    setBookmarked(next);
    setBump(true);
    setTimeout(() => setBump(false), 250);

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
    <button
      type="button"
      onClick={handleClick}
      aria-label={bookmarked ? "Remove bookmark" : "Bookmark this post"}
      aria-pressed={bookmarked}
      className={
        className ??
        "flex items-center text-gray-600 dark:text-gray-300 hover:text-yellow-500 transition"
      }
      style={{
        transform: bump ? "scale(1.2)" : "scale(1)",
        transition: "transform 0.15s ease",
      }}
    >
      {bookmarked ? (
        <FaBookmark className="text-yellow-500" />
      ) : (
        <FaRegBookmark />
      )}
    </button>
  );
}
