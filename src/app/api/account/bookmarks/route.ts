import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { NextResponse } from "next/server";
import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { getUserBookmarks } from "@/lib/data/bookmarks";

export const dynamic = "force-dynamic";

/**
 * Paginated bookmarks for the signed-in user. Powers the "Load more" button
 * on the /bookmarks page. The first page is rendered server-side; this
 * endpoint is only hit for subsequent pages.
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      throw new ApiError("UNAUTHENTICATED", "Sign in required.");
    }

    const url = new URL(req.url);
    const skip = parseInt(url.searchParams.get("skip") || "0", 10);
    const limit = parseInt(url.searchParams.get("limit") || "12", 10);

    const result = await getUserBookmarks(session.user._id, {
      skip: Number.isFinite(skip) ? skip : 0,
      limit: Number.isFinite(limit) ? limit : 12,
    });

    return NextResponse.json(result);
  } catch (err) {
    return apiErrorResponse(err);
  }
}
