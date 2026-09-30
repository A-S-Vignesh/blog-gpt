import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import Notification from "@/models/Notification";
import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { rateLimit } from "@/lib/rateLimit";
import {
  getUnreadNotificationCount,
  getUserNotifications,
} from "@/lib/data/notifications";
import {
  NOTIFICATION_TYPES_BY_FILTER,
  parseNotificationFilter,
} from "@/types/notification";

export const dynamic = "force-dynamic";

/** Max ids accepted by a single "mark these read" call. */
const MAX_IDS = 100;

/**
 * Paginated notifications for the signed-in user. The /notifications page
 * renders the first page server-side; this serves tab switches, "Load more",
 * and the "show new notifications" refresh.
 *
 * Query: ?cursor=<id>&limit=<n>&filter=all|comments|likes|follows
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      throw new ApiError("UNAUTHENTICATED", "Sign in required.");
    }

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);

    const page = await getUserNotifications(session.user._id, {
      cursor: url.searchParams.get("cursor"),
      limit: Number.isFinite(limit) ? limit : 20,
      filter: parseNotificationFilter(url.searchParams.get("filter")),
    });

    return NextResponse.json(page, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

/**
 * Mark notifications as read.
 *
 * Body, one of:
 *   { ids: string[] }              → those notifications
 *   { all: true, before?, filter? } → every unread one created at or before
 *                                    `before` (an ISO time; defaults to now),
 *                                    limited to one tab's types by `filter`
 *
 * `before` and `filter` let the page mark exactly what it has shown, so a
 * notification that arrives while the page is open (or that belongs to a tab
 * the user isn't looking at) stays unread.
 */
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      throw new ApiError("UNAUTHENTICATED", "Sign in required.");
    }
    const userId = session.user._id;

    const rl = await rateLimit({
      key: `notifications-read:${userId}`,
      windowMs: 60_000,
      max: 60,
    });
    if (!rl.ok) {
      throw new ApiError("RATE_LIMITED", "Too many requests.", {
        retryAfterSeconds: rl.retryAfterSeconds,
      });
    }

    const body = (await req.json().catch(() => null)) as {
      ids?: unknown;
      all?: unknown;
      before?: unknown;
      filter?: unknown;
    } | null;

    // Always scoped to the caller, so ids belonging to someone else are
    // silently ignored rather than marked.
    const filter: Record<string, unknown> = {
      recipient: new Types.ObjectId(userId),
      read: false,
    };

    if (body?.all === true) {
      let before = new Date();
      if (typeof body.before === "string") {
        const parsed = new Date(body.before);
        if (Number.isNaN(parsed.getTime())) {
          throw new ApiError("BAD_REQUEST", "`before` must be an ISO date.");
        }
        // Never later than now: a client clock in the future can't reach
        // notifications the user hasn't been shown yet.
        if (parsed < before) before = parsed;
      }
      filter.createdAt = { $lte: before };

      const types =
        NOTIFICATION_TYPES_BY_FILTER[
          parseNotificationFilter(
            typeof body.filter === "string" ? body.filter : null,
          )
        ];
      if (types) filter.type = { $in: types };
    } else if (Array.isArray(body?.ids)) {
      const ids = body.ids.filter(
        (id): id is string =>
          typeof id === "string" && Types.ObjectId.isValid(id),
      );
      if (ids.length === 0 || ids.length > MAX_IDS) {
        throw new ApiError(
          "BAD_REQUEST",
          `Provide between 1 and ${MAX_IDS} valid notification ids.`,
        );
      }
      filter._id = { $in: ids.map((id) => new Types.ObjectId(id)) };
    } else {
      throw new ApiError(
        "BAD_REQUEST",
        "Provide `ids` (array) or `all: true`.",
      );
    }

    await connectToDatabase();
    const result = await Notification.updateMany(filter, {
      $set: { read: true },
    });
    const unreadCount = await getUnreadNotificationCount(userId);

    return NextResponse.json({
      ok: true,
      updated: result.modifiedCount ?? 0,
      unreadCount,
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
