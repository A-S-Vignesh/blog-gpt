"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/provider/ToastProvider";

// ─── Types ──────────────────────────────────────────────────────────────────
interface Particle {
  id: number;
  angle: number; // degrees
  color: string;
}

// ─── Config ─────────────────────────────────────────────────────────────────
const DEBOUNCE_MS = 600; // wait this long after last click before hitting API
const PARTICLE_COLORS = [
  "#f43f5e",
  "#fb7185",
  "#fda4af",
  "#f97316",
  "#fbbf24",
  "#a855f7",
];
const NUM_PARTICLES = 8;

// ─── Component ───────────────────────────────────────────────────────────────
export default function LikeButton({
  postSlug,
  username,
  initialLiked,
  initialCount,
  isAuthenticated,
}: {
  postSlug: string;
  username: string;
  initialLiked: boolean;
  initialCount: number;
  isAuthenticated: boolean;
}) {
  const { showToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  // Send a logged-out user to sign-in, returning them to this post afterwards.
  const promptSignIn = useCallback(() => {
    showToast("Please sign in to like this post.", "info");
    router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`);
  }, [router, pathname, showToast]);

  // ── Core state ──────────────────────────────────────────────────────────
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [burst, setBurst] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [bump, setBump] = useState(false); // heart scale bump
  const [prevDir, setPrevDir] = useState<"up" | "down">("up"); // for count slide

  // ── Debounce refs ────────────────────────────────────────────────────────
  const pendingRef = useRef(liked); // what the server hasn't seen yet
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflight = useRef(false); // an API call is in progress

  // Track what the server *last confirmed*
  const serverLiked = useRef(initialLiked);
  const serverCount = useRef(initialCount);

  // ── Flush: actually call the API ─────────────────────────────────────────
  // The API is now idempotent — we send the DESIRED state, not a toggle.
  // This makes rapid clicks, concurrent tabs, and stale server beliefs all safe.
  const flush = useCallback(
    async (newLiked: boolean) => {
      if (inflight.current) return;
      if (newLiked === serverLiked.current) return;

      inflight.current = true;

      try {
        const res = await fetch(`/api/post/${username}/${postSlug}/like`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ liked: newLiked }),
        });
        // Session expired between page load and this click — roll back and
        // route to sign-in rather than showing a vague error.
        if (res.status === 401) {
          setLiked(serverLiked.current);
          setCount(serverCount.current);
          pendingRef.current = serverLiked.current;
          promptSignIn();
          return;
        }

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data?.error || data?.message || "Like failed");
        }

        // Trust the server response fully — it's the source of truth.
        serverLiked.current = data.liked;
        serverCount.current = data.likesCount;
        setLiked(data.liked);
        setCount(data.likesCount);
      } catch {
        // Rollback to last confirmed server state on failure.
        setLiked(serverLiked.current);
        setCount(serverCount.current);
        pendingRef.current = serverLiked.current;
        showToast("Something went wrong. Try again.", "error");
      } finally {
        inflight.current = false;

        // If the user changed their mind mid-flight, fire one more request.
        if (pendingRef.current !== serverLiked.current) {
          flush(pendingRef.current);
        }
      }
    },
    [postSlug, username, showToast, promptSignIn],
  );

  // ── Handle click ─────────────────────────────────────────────────────────
  const handleClick = useCallback(() => {
    // Gate before any optimistic UI — a logged-out click can never succeed,
    // so prompt sign-in instead of faking a like that the API will reject.
    if (!isAuthenticated) {
      promptSignIn();
      return;
    }

    const next = !pendingRef.current;
    pendingRef.current = next;

    // 1) Instant optimistic UI
    setPrevDir(next ? "up" : "down");
    setLiked(next);
    setCount((c) => (next ? c + 1 : c - 1));

    // 2) Heart bump animation
    setBump(true);
    setTimeout(() => setBump(false), 300);

    // 3) Burst particles (only on like, not unlike)
    if (next) {
      const pts: Particle[] = Array.from({ length: NUM_PARTICLES }, (_, i) => ({
        id: Date.now() + i,
        angle: (360 / NUM_PARTICLES) * i,
        color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
      }));
      setParticles(pts);
      setBurst(true);
      setTimeout(() => {
        setBurst(false);
        setParticles([]);
      }, 700);
    }

    // 4) Debounce the API call
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => flush(next), DEBOUNCE_MS);
  }, [flush, isAuthenticated, promptSignIn]);

  // Cleanup timer on unmount
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={liked ? "Unlike post" : "Like post"}
      aria-pressed={liked}
      className="relative flex items-center gap-2 group select-none"
    >
      {/* ── Heart + burst container ─────────────────────────────────────── */}
      <span className="relative flex items-center justify-center">
        {/* Burst particles */}
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute w-2 h-2 rounded-full pointer-events-none"
            style={{
              background: p.color,
              transform: `rotate(${p.angle}deg) translateY(0px)`,
              opacity: burst ? 0 : 1,
              transition: burst
                ? `transform 0.6s ease-out, opacity 0.6s ease-out`
                : "none",
              ...(burst
                ? {
                    transform: `rotate(${p.angle}deg) translateY(-22px)`,
                    opacity: 0,
                  }
                : {}),
            }}
          />
        ))}

        {/* Heart SVG */}
        <svg
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 transition-none"
          style={{
            transform: bump ? "scale(1.4)" : liked ? "scale(1.1)" : "scale(1)",
            transition: bump
              ? "transform 0.15s cubic-bezier(.36,.07,.19,.97)"
              : "transform 0.2s ease",
          }}
        >
          {/* Shadow / outline heart */}
          <path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
               2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09
               C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5
               c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            className={`transition-all duration-200 ${
              liked
                ? "fill-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.7)]"
                : "fill-none stroke-gray-400 dark:stroke-gray-500 group-hover:stroke-red-400"
            }`}
            strokeWidth={liked ? 0 : 1.8}
          />
        </svg>
      </span>

      {/* ── Animated count ──────────────────────────────────────────────── */}
      <span
        key={`${count}-${prevDir}`} // re-mount on change to re-trigger animation
        className={`text-sm font-semibold tabular-nums ${
          liked ? "text-red-500" : "text-gray-500 dark:text-gray-400"
        }`}
        style={{
          animation: `countSlide${prevDir === "up" ? "Up" : "Down"} 0.2s ease both`,
        }}
      >
        {count}
      </span>

      {/* ── Keyframes injected once ──────────────────────────────────────── */}
      <style>{`
        @keyframes countSlideUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        @keyframes countSlideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </button>
  );
}
