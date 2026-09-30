import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { rateLimit } from "@/lib/rateLimit";
import { normalizePrefs } from "@/lib/notifications";
import {
  NOTIFICATION_TYPES,
  type NotificationPrefs,
} from "@/types/notification";

export const dynamic = "force-dynamic";

async function readPrefs(userId: string): Promise<NotificationPrefs> {
  const user = await User.findById(userId)
    .select("notificationPrefs")
    .lean<{ notificationPrefs?: Partial<NotificationPrefs> }>();
  if (!user) {
    throw new ApiError("NOT_FOUND", "User not found.");
  }
  return normalizePrefs(user.notificationPrefs);
}

/** The signed-in user's per-type notification settings. */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      throw new ApiError("UNAUTHENTICATED", "Sign in required.");
    }
    await connectToDatabase();
    const prefs = await readPrefs(session.user._id);
    return NextResponse.json({ prefs });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

/**
 * Update one or more notification types.
 * Body: a partial { comment, reply, like, follow } of booleans.
 *
 * Kept off /api/useraction/update on purpose: that route has a strict profile
 * whitelist, and only known keys with boolean values are ever written here.
 */
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      throw new ApiError("UNAUTHENTICATED", "Sign in required.");
    }

    const rl = await rateLimit({
      key: `notification-prefs:${session.user._id}`,
      windowMs: 60_000,
      max: 30,
    });
    if (!rl.ok) {
      throw new ApiError(
        "RATE_LIMITED",
        "You're changing settings too quickly. Please wait a moment.",
        { retryAfterSeconds: rl.retryAfterSeconds },
      );
    }

    const body = (await req.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;

    const update: Record<string, boolean> = {};
    for (const type of NOTIFICATION_TYPES) {
      const value = body?.[type];
      if (value === undefined) continue;
      if (typeof value !== "boolean") {
        throw new ApiError("BAD_REQUEST", `\`${type}\` must be a boolean.`);
      }
      update[`notificationPrefs.${type}`] = value;
    }
    if (Object.keys(update).length === 0) {
      throw new ApiError(
        "BAD_REQUEST",
        `Provide at least one of: ${NOTIFICATION_TYPES.join(", ")}.`,
      );
    }

    await connectToDatabase();
    await User.updateOne({ _id: session.user._id }, { $set: update });
    const prefs = await readPrefs(session.user._id);

    return NextResponse.json({ ok: true, prefs });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
