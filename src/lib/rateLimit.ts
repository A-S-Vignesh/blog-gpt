type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds?: number;
};

type RateLimitOptions = {
  /**
   * Unique identifier for this bucket.
   * Prefer user id when available; otherwise, fall back to IP.
   */
  key: string;
  /**
   * Window size in milliseconds.
   */
  windowMs: number;
  /**
   * Maximum number of allowed hits within the window.
   */
  max: number;
};

// In-memory counters per server instance. This is not perfect for
// distributed deployments, but it provides a good first line of defense
// against abuse without introducing external infrastructure.
const buckets = new Map<
  string,
  {
    count: number;
    firstHitAt: number;
  }
>();

export function rateLimit(options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(options.key);

  if (!bucket || now - bucket.firstHitAt > options.windowMs) {
    buckets.set(options.key, { count: 1, firstHitAt: now });
    return {
      ok: true,
      remaining: options.max - 1,
    };
  }

  if (bucket.count >= options.max) {
    const retryAfterMs = bucket.firstHitAt + options.windowMs - now;
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  bucket.count += 1;
  return {
    ok: true,
    remaining: options.max - bucket.count,
  };
}

