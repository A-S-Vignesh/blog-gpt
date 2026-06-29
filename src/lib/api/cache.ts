import { NextResponse } from "next/server";

export type CacheProfile =
  /** Mutable content, short edge cache. */
  | "short"
  /** Slower-moving lists (recent posts, related). */
  | "medium"
  /** Trending, OG images — refresh in the background. */
  | "long"
  /** User-specific or session-tinged. */
  | "private"
  /** Always fresh — never cached. */
  | "none";

const HEADERS: Record<CacheProfile, string> = {
  // s-maxage caches at the CDN; stale-while-revalidate keeps responses
  // snappy while a refresh happens in the background.
  short: "public, s-maxage=60, stale-while-revalidate=120",
  medium: "public, s-maxage=300, stale-while-revalidate=900",
  long: "public, s-maxage=600, stale-while-revalidate=3600",
  private: "private, max-age=0, must-revalidate",
  none: "no-store",
};

/** Apply cache headers to an existing NextResponse. */
export function withCache(
  response: NextResponse,
  profile: CacheProfile,
): NextResponse {
  response.headers.set("Cache-Control", HEADERS[profile]);
  // Vary on Authorization so signed-in / signed-out variants don't collide
  // when CDNs cache the response.
  response.headers.set("Vary", "Authorization, Cookie");
  return response;
}

/** Build a cached JSON response in one call. */
export function cachedJson(
  data: unknown,
  profile: CacheProfile,
  init?: ResponseInit,
): NextResponse {
  const res = NextResponse.json(data, init);
  return withCache(res, profile);
}
