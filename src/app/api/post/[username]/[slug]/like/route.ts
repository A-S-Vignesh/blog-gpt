import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import Post from "@/models/Post";
import Like from "@/models/Like";
import { Types } from "mongoose";
import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { rateLimit } from "@/lib/rateLimit";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { postDetailTag } from "@/lib/data/posts";

/**
 * Idempotent SET — the client tells us the desired state, not a toggle.
 *
 * Why not a toggle:
 *   - Concurrent / multi-tab requests can each flip the bit, cancelling
 *     out and leaving the user with the OPPOSITE of what they wanted.
 *   - Client/server state drift (e.g. another tab already liked) causes
 *     the next "like" click to actually unlike.
 *
 * `likesCount` is RECOMPUTED from the Like collection on every write so
 * unmigrated legacy posts (where the field was undefined or stale) heal
 * automatically. The Like collection is the source of truth.
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
        "You must be signed in to like a post.",
      );
    }

    const rl = await rateLimit({
      key: `like:${session.user._id}`,
      windowMs: 60_000,
      max: 30,
    });
    if (!rl.ok) {
      throw new ApiError(
        "RATE_LIMITED",
        "You are liking too quickly. Please wait a moment.",
        { retryAfterSeconds: rl.retryAfterSeconds },
      );
    }

    const body = (await req.json().catch(() => ({}))) as { liked?: boolean };
    const desired = body?.liked;
    if (typeof desired !== "boolean") {
      throw new ApiError(
        "BAD_REQUEST",
        "Missing required field `liked` (boolean).",
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
      // Idempotent insert: $setOnInsert + upsert never errors on duplicates.
      await Like.updateOne(
        { user: userId, post: postId },
        { $setOnInsert: { user: userId, post: postId } },
        { upsert: true },
      );
    } else {
      // Idempotent delete: ignored if no doc exists.
      await Like.deleteOne({ user: userId, post: postId });
    }

    // Recompute the count from the source of truth. This single extra
    // count() call is the price of correctness across unmigrated legacy
    // data + concurrent writes + cross-tab consistency. It's ~5-20ms with
    // the (user, post) and (post, createdAt) indexes already in place.
    const likesCount = await Like.countDocuments({ post: postId });

    // Sync the denormalized counter on Post so list views match.
    await Post.updateOne({ _id: postId }, { $set: { likesCount } });

    revalidateTag(postDetailTag(slug), "default");

    return NextResponse.json({
      success: true,
      liked: desired,
      likesCount,
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
