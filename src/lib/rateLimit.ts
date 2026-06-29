import { connectToDatabase } from "@/lib/mongodb";
import RateLimitBucket from "@/models/RateLimitBucket";

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds?: number;
};

export type RateLimitOptions = {
  /** Unique bucket identifier (prefer userId, fall back to IP). */
  key: string;
  /** Fixed window size in milliseconds. */
  windowMs: number;
  /** Maximum hits allowed within the window. */
  max: number;
};

/**
 * MongoDB-backed fixed-window rate limiter.
 *
 * Survives across serverless instances because it stores counters in Mongo.
 * Each (key, windowStart) tuple is a unique doc; the doc is atomically
 * incremented and auto-expires via a TTL index, so there is no GC to manage.
 *
 * Trade-offs vs Redis: ~5-15ms per check (one round-trip) instead of <1ms.
 * For our scale (low thousands of requests/min) this is the right tool.
 */
export async function rateLimit(
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStartMs =
    Math.floor(now / options.windowMs) * options.windowMs;
  const windowStart = new Date(windowStartMs);
  // Keep doc alive for one extra window so late writes can't accidentally
  // resurrect an old counter due to TTL eviction race.
  const expiresAt = new Date(windowStartMs + options.windowMs * 2);

  try {
    await connectToDatabase();

    const doc = await RateLimitBucket.findOneAndUpdate(
      { key: options.key, windowStart },
      {
        $inc: { count: 1 },
        $setOnInsert: { expiresAt },
      },
      { upsert: true, new: true },
    ).lean<{ count: number }>();

    const count = doc?.count ?? 1;

    if (count > options.max) {
      const retryAfterMs = windowStartMs + options.windowMs - now;
      return {
        ok: false,
        remaining: 0,
        retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
      };
    }

    return {
      ok: true,
      remaining: Math.max(0, options.max - count),
    };
  } catch (err) {
    // Fail open: if Mongo is briefly unavailable, do NOT block legitimate
    // requests. This is a defense-in-depth limiter, not a security gate.
    console.error("[rateLimit] mongo error, failing open:", err);
    return { ok: true, remaining: options.max };
  }
}

/**
 * Extract a best-effort client IP from the request headers.
 * Use this only as a fallback when no userId is available.
 */
export function getClientIp(req: Request): string {
  const headers = req.headers;
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
