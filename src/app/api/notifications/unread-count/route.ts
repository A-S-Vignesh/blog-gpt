import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { NextResponse } from "next/server";
import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { getUnreadNotificationCount } from "@/lib/data/notifications";

export const dynamic = "force-dynamic";

/**
 * Unread count for the bell badge. Polled about once a minute by every
 * signed-in tab (only while the tab is visible), so it is deliberately a
 * single capped count on the (recipient, read) index and nothing else. No
 * rate limit: the limiter itself is a DB write and would double the cost.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      throw new ApiError("UNAUTHENTICATED", "Sign in required.");
    }

    const count = await getUnreadNotificationCount(session.user._id);
    return NextResponse.json(
      { count },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return apiErrorResponse(err);
  }
}
