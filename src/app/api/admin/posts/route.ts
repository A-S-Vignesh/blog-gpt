import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { apiErrorResponse } from "@/lib/api/errors";
import { listAdminPosts } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

/**
 * Paginated post list for the admin moderation screens.
 *
 * Read-only, so it needs no rate limit beyond the admin gate itself — but it
 * still runs requireAdmin() first, because the rows expose author emails that
 * the public API never returns.
 */
export async function GET(req: Request) {
  try {
    await requireAdmin();

    const url = new URL(req.url);
    const moderationStatus = url.searchParams.get("moderationStatus");
    const status = url.searchParams.get("status");
    const q = url.searchParams.get("q") || undefined;
    const skip = parseInt(url.searchParams.get("skip") || "0", 10);
    const limit = parseInt(url.searchParams.get("limit") || "25", 10);

    const page = await listAdminPosts({
      moderationStatus:
        moderationStatus === "pending" ||
        moderationStatus === "approved" ||
        moderationStatus === "flagged"
          ? moderationStatus
          : undefined,
      status:
        status === "draft" || status === "published" || status === "archived"
          ? status
          : undefined,
      q,
      skip: Number.isFinite(skip) ? skip : 0,
      limit: Number.isFinite(limit) ? limit : 25,
    });

    return NextResponse.json(page);
  } catch (err) {
    return apiErrorResponse(err);
  }
}
