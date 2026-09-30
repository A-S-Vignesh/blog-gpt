import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js 16 "Proxy" (the renamed `middleware.ts`) — a centralized, OPTIMISTIC
 * authentication gate.
 *
 * It runs before the matched routes render and bounces signed-out visitors to
 * the sign-in page, so the protected pages no longer have to be the first line
 * of defense. It is deliberately COARSE: it only verifies the NextAuth JWT in
 * the request cookie and never touches the database — proxy runs on every
 * matched request (including prefetches), so DB calls here would be costly.
 *
 * Per Next.js' own guidance, proxy "should not be your only line of defense."
 * The pages and API routes keep their own `getServerSession` checks: they need
 * the session data anyway, and they enforce what proxy CANNOT — ownership
 * (IDOR), banned/deleted accounts, and other DB-backed authorization. This
 * layers on top of those checks; it does not replace them.
 */
export async function proxy(req: NextRequest) {
  const token = await getToken({
    req,
    // NEXTAUTH_URL drives the cookie name (secure vs not), so getToken picks
    // the right cookie in both dev (http) and production (https) automatically.
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const signInUrl = new URL("/auth/signin", req.url);
    const { pathname, search } = req.nextUrl;
    // Preserve where the user was headed so sign-in can return them there.
    signInUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(signInUrl);
  }

  // NOTE: the admin ROLE is deliberately NOT checked here.
  //
  // The obvious thing is to bounce non-admins on `token.role !== "admin"`, but
  // that claim is a mirror of the User document refreshed only every ~5
  // minutes. Checking it here means a just-promoted admin is redirected to
  // /403 by their own stale cookie until the window elapses or they sign out —
  // a confusing dead end, and the check buys nothing: /admin/layout.tsx calls
  // getAdminActor() and every /api/admin route calls requireAdmin(), both of
  // which read the role straight from MongoDB. A non-admin still lands on /403,
  // just one render later, and a promotion takes effect on the next request.
  const res = NextResponse.next();

  // Belt-and-suspenders with robots.ts and the per-page `robots: { index:
  // false }`: nothing under /admin may ever be indexed, even if a URL leaks.
  if (req.nextUrl.pathname.startsWith("/admin")) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }

  return res;
}

export const config = {
  // Only the authenticated surfaces. Every other route (/, /explore, /post,
  // /:username, blog posts, /about, /pricing, /contact, ...) stays public and
  // is skipped entirely. `:path*` also matches the base path (zero segments).
  matcher: [
    "/admin/:path*",
    // NOT "/advertise/:path*" — that would also match /advertise itself,
    // which is a public sales page and must stay reachable signed-out.
    "/advertise/dashboard/:path*",
    "/advertise/new/:path*",
    "/advertise/campaigns/:path*",
    "/feed/:path*",
    "/bookmarks/:path*",
    "/notifications/:path*",
    "/settings/:path*",
    "/billing/:path*",
    "/post/create/:path*",
    "/post/generate/:path*",
    "/:username/:slug/edit",
  ],
};
