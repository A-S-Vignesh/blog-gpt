import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import Post from "@/models/Post";
import Bookmark from "@/models/Bookmark";
import { User } from "@/models/User";
import { Types } from "mongoose";
import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { rateLimit } from "@/lib/rateLimit";
import { NextResponse } from "next/server";

/**
 * Idempotent SET — the client declares the desired bookmark state.
 *
 * Same rationale as the like endpoint:
 *   - Toggle-style APIs invert on concurrent requests / stale client state.
 *   - We recompute `bookmarksCount` from the Bookmark collection on every
 *     write so legacy unmigrated data heals itself.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ username: string; slug: string }> },
) {
  try {
    const { username, slug } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      throw new ApiError(
        "UNAUTHENTICATED",
        "You must be signed in to bookmark a post.",
      );
    }

    const rl = await rateLimit({
      key: `bookmark:${session.user._id}`,
      windowMs: 60_000,
      max: 30,
    });
    if (!rl.ok) {
      throw new ApiError(
        "RATE_LIMITED",
        "You are bookmarking too quickly. Please wait a moment.",
        { retryAfterSeconds: rl.retryAfterSeconds },
      );
    }

    const body = (await req.json().catch(() => ({}))) as {
      bookmarked?: boolean;
    };
    const desired = body?.bookmarked;
    if (typeof desired !== "boolean") {
      throw new ApiError(
        "BAD_REQUEST",
        "Missing required field `bookmarked` (boolean).",
      );
    }

    await connectToDatabase();

    const userId = new Types.ObjectId(session.user._id);
    const owner = await Post.findOne({ slug })
      .populate("creator", "username")
      .select("_id creator");
    if (
      !owner ||
      (owner.creator as any).username?.toLowerCase() !== username.toLowerCase()
    ) {
      throw new ApiError("NOT_FOUND", "Post not found.");
    }
    const postId = owner._id as Types.ObjectId;

    if (desired) {
      await Bookmark.updateOne(
        { user: userId, post: postId },
        { $setOnInsert: { user: userId, post: postId } },
        { upsert: true },
      );
    } else {
      await Bookmark.deleteOne({ user: userId, post: postId });
    }

    // Recompute both denormalized counters from the source of truth.
    const [postBookmarksCount, userBookmarksCount] = await Promise.all([
      Bookmark.countDocuments({ post: postId }),
      Bookmark.countDocuments({ user: userId }),
    ]);

    await Promise.all([
      Post.updateOne(
        { _id: postId },
        { $set: { bookmarksCount: postBookmarksCount } },
      ),
      User.updateOne(
        { _id: userId },
        { $set: { bookmarksCount: userBookmarksCount } },
      ),
    ]);

    return NextResponse.json({
      success: true,
      bookmarked: desired,
      bookmarksCount: postBookmarksCount,
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string; slug: string }> },
) {
  try {
    const { slug } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      return NextResponse.json({ bookmarked: false });
    }

    await connectToDatabase();
    const post = await Post.findOne({ slug }).select("_id");
    if (!post) {
      return NextResponse.json({ bookmarked: false });
    }
    const exists = await Bookmark.exists({
      user: session.user._id,
      post: post._id,
    });
    return NextResponse.json({ bookmarked: Boolean(exists) });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
