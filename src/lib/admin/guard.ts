import { cache } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { ApiError } from "@/lib/api/errors";
import { Types } from "mongoose";

export type AdminActor = {
  id: string;
  objectId: Types.ObjectId;
  email: string;
  name: string;
  username: string;
};

/**
 * The single authorization gate for every admin surface.
 *
 * Deliberately re-reads the role from MongoDB rather than trusting
 * `session.user.role`. The session role is a mirror refreshed at most every 5
 * minutes (see the jwt callback in authOptions.ts) — fine for hiding a nav
 * link, far too slow when the action on the other side can ban an account or
 * delete a post. Reading the User document makes a demotion effective on the
 * very next request, at the cost of one indexed lookup per admin call. Admin
 * traffic is a rounding error next to the public site, so that trade is free.
 *
 * Also re-checks `banned` and `deletionScheduledFor`: an admin whose own
 * account is disabled must not keep panel access.
 *
 * Throws ApiError so routes can let it fall through to apiErrorResponse().
 *
 * Wrapped in React's `cache()` so it is memoized per request. Every admin data
 * function calls this, and so does the page and the route handler around it —
 * without memoization a single page render would repeat the same session read
 * and user lookup five or six times. With it, the belt-and-braces checks are
 * free, which is what makes it reasonable to call this everywhere.
 */
export const requireAdmin = cache(async function requireAdmin(): Promise<
  AdminActor
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?._id) {
    throw new ApiError("UNAUTHENTICATED", "Sign in required.");
  }

  await connectToDatabase();
  const user = await User.findById(session.user._id).select(
    "role banned deletionScheduledFor email name username",
  );

  if (!user || user.banned || user.deletionScheduledFor) {
    throw new ApiError("FORBIDDEN", "Account is not active.");
  }
  if (user.role !== "admin") {
    throw new ApiError("FORBIDDEN", "Admin access required.");
  }

  return {
    id: user._id.toString(),
    objectId: user._id,
    email: user.email,
    name: user.name,
    username: user.username,
  };
});

/**
 * Reject a state-changing request that was initiated by another site.
 *
 * The NextAuth session cookie is SameSite=Lax, which already stops a browser
 * from attaching it to a cross-site POST/PATCH/DELETE — so this is a second
 * lock on the same door. It is cheap and worth having on endpoints that can
 * ban accounts and delete content: if the cookie policy is ever loosened, or a
 * future browser quirk weakens Lax, these routes stay closed.
 *
 * A MISSING Origin header is allowed. Browsers always attach Origin to
 * cross-origin requests and to same-origin non-GET fetches, so "absent" means
 * a non-browser client (curl, a server job, a test) — which by definition has
 * no ambient cookie to be tricked into replaying, and therefore cannot be the
 * victim of CSRF.
 */
export function assertSameOrigin(req: Request): void {
  const origin = req.headers.get("origin");
  if (!origin) return;

  // Behind a proxy (Vercel, Cloudflare) the browser-facing hostname arrives in
  // x-forwarded-host; `host` is then the internal one and would never match.
  const expected =
    req.headers.get("x-forwarded-host") || req.headers.get("host");

  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new ApiError("FORBIDDEN", "Invalid request origin.");
  }

  if (!expected || originHost !== expected) {
    throw new ApiError("FORBIDDEN", "Cross-site request rejected.");
  }
}

/**
 * requireAdmin() + assertSameOrigin(), for the mutating routes.
 *
 * Every admin PATCH/DELETE should use this rather than requireAdmin() alone,
 * so the CSRF check can never be forgotten on a new endpoint.
 */
export async function requireAdminMutation(req: Request): Promise<AdminActor> {
  assertSameOrigin(req);
  return requireAdmin();
}

/**
 * Non-throwing variant for server components that want to render a redirect
 * instead of a JSON error. Returns null when the caller is not an admin.
 */
export async function getAdminActor(): Promise<AdminActor | null> {
  try {
    return await requireAdmin();
  } catch {
    return null;
  }
}
