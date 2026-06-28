import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import Follow from "@/models/Follow";
import { Types } from "mongoose";
import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { rateLimit } from "@/lib/rateLimit";
import { NextResponse } from "next/server";

/**
 * Idempotent SET — the client declares the desired follow state.
 *
 * Same rationale as the like endpoint:
 *   - Toggle-style APIs invert on concurrent requests / stale client state.
 *   - We recompute follower/following counts from the Follow collection on
 *     every write so they always reflect reality.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    const { username } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      throw new ApiError("UNAUTHENTICATED", "You must be signed in to follow.");
    }

    // Throttle follow/unfollow churn per user — blocks mass-follow bots and
    // follow/unfollow spam. 30 actions/minute is generous for a human.
    const rl = await rateLimit({
      key: `follow:${session.user._id}`,
      windowMs: 60 * 1000,
      max: 30,
    });
    if (!rl.ok) {
      throw new ApiError(
        "RATE_LIMITED",
        "You're doing that too quickly. Please slow down.",
        { retryAfterSeconds: rl.retryAfterSeconds },
      );
    }

    const body = (await req.json().catch(() => ({}))) as {
      following?: boolean;
    };
    const desired = body?.following;
    if (typeof desired !== "boolean") {
      throw new ApiError(
        "BAD_REQUEST",
        "Missing required field `following` (boolean).",
      );
    }

    await connectToDatabase();

    const target = await User.findOne({ username })
      .collation({ locale: "en", strength: 2 })
      .select("_id");
    if (!target) {
      throw new ApiError("NOT_FOUND", "User not found.");
    }
    if (target._id.toString() === session.user._id) {
      throw new ApiError("BAD_REQUEST", "You can't follow yourself.");
    }

    const followerId = new Types.ObjectId(session.user._id);
    const followingId = target._id as Types.ObjectId;

    // Did the relationship actually change? The unique index makes the write
    // idempotent; `upsertedCount`/`deletedCount` tell us whether a doc was
    // really added/removed, so we only adjust counters on a real transition.
    let changed: boolean;
    if (desired) {
      const r = await Follow.updateOne(
        { follower: followerId, following: followingId },
        { $setOnInsert: { follower: followerId, following: followingId } },
        { upsert: true },
      );
      changed = (r.upsertedCount ?? 0) > 0;
    } else {
      const r = await Follow.deleteOne({
        follower: followerId,
        following: followingId,
      });
      changed = (r.deletedCount ?? 0) > 0;
    }

    // Counter strategy: on a real transition, apply an atomic `$inc` via an
    // aggregation-pipeline update. This replaces the old O(N) `countDocuments`
    // (which scanned the whole Follow collection on every write and falls over
    // for users with millions of followers) and is race-free — no read-then-
    // write window for concurrent follows to clobber. `$max` clamps at 0 so
    // any pre-existing drift can't push a counter negative.
    const adjust = (field: string) => ({
      [field]: desired
        ? { $add: [{ $ifNull: [`$${field}`, 0] }, 1] }
        : { $max: [0, { $add: [{ $ifNull: [`$${field}`, 0] }, -1] }] },
    });

    let followersCount: number;
    let followingCount: number;

    if (changed) {
      // `timestamps: false`: a follow is engagement, not a profile edit, so it
      // must not bump either user's `updatedAt` (keeps it consistent with
      // like/comment/bookmark and safe for any future user-freshness signal).
      const [targetDoc, followerDoc] = await Promise.all([
        User.findByIdAndUpdate(followingId, [{ $set: adjust("followersCount") }], {
          new: true,
          timestamps: false,
        })
          .select("followersCount")
          .lean<{ followersCount?: number }>(),
        User.findByIdAndUpdate(followerId, [{ $set: adjust("followingCount") }], {
          new: true,
          timestamps: false,
        })
          .select("followingCount")
          .lean<{ followingCount?: number }>(),
      ]);
      followersCount = targetDoc?.followersCount ?? 0;
      followingCount = followerDoc?.followingCount ?? 0;
    } else {
      // Already in the desired state — return current counters unchanged.
      const [targetDoc, followerDoc] = await Promise.all([
        User.findById(followingId)
          .select("followersCount")
          .lean<{ followersCount?: number }>(),
        User.findById(followerId)
          .select("followingCount")
          .lean<{ followingCount?: number }>(),
      ]);
      followersCount = targetDoc?.followersCount ?? 0;
      followingCount = followerDoc?.followingCount ?? 0;
    }

    return NextResponse.json({
      success: true,
      following: desired,
      followersCount,
      followingCount,
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    const { username } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      return NextResponse.json({ following: false });
    }

    await connectToDatabase();
    const target = await User.findOne({ username })
      .collation({ locale: "en", strength: 2 })
      .select("_id");
    if (!target) {
      return NextResponse.json({ following: false });
    }
    const exists = await Follow.exists({
      follower: session.user._id,
      following: target._id,
    });
    return NextResponse.json({ following: Boolean(exists) });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
