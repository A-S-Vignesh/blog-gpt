import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { connectToDatabase } from "@/lib/mongodb";
import Post from "@/models/Post";
import PostView from "@/models/PostView";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { ApiError, apiErrorResponse } from "@/lib/api/errors";

const DEDUP_WINDOW_HOURS = 24;
const DEDUP_WINDOW_MS = DEDUP_WINDOW_HOURS * 60 * 60 * 1000;
const VIEW_RATE_LIMIT_PER_MINUTE = 30;

function hashViewer(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const ip = getClientIp(req);
    const session = await getServerSession(authOptions);
    const viewerId = session?.user?._id?.toString() || ip;

    const rl = await rateLimit({
      key: `view:${viewerId}`,
      windowMs: 60_000,
      max: VIEW_RATE_LIMIT_PER_MINUTE,
    });
    if (!rl.ok) {
      throw new ApiError("RATE_LIMITED", "Too many view requests.", {
        retryAfterSeconds: rl.retryAfterSeconds,
      });
    }

    await connectToDatabase();

    const post = await Post.findOne({ slug }).select("_id creator");
    if (!post) {
      throw new ApiError("NOT_FOUND", "Post not found.");
    }

    // Author viewing their own post should not inflate the count.
    if (
      session?.user?._id &&
      post.creator.toString() === session.user._id.toString()
    ) {
      return NextResponse.json({ success: true, deduped: true });
    }

    const viewerHash = hashViewer(viewerId);
    const expiresAt = new Date(Date.now() + DEDUP_WINDOW_MS);

    // Dedup: try to insert a (postId, viewerHash) record. If a record exists
    // (unique-index violation), this viewer already counted within the window.
    try {
      await PostView.create({
        postId: post._id,
        viewerHash,
        expiresAt,
      });
    } catch (err: any) {
      if (err?.code === 11000) {
        return NextResponse.json({ success: true, deduped: true });
      }
      throw err;
    }

    const updated = await Post.findByIdAndUpdate(
      post._id,
      { $inc: { views: 1 } },
      { new: true, projection: { views: 1 } },
    ).lean<{ views: number }>();

    return NextResponse.json({
      success: true,
      views: updated?.views ?? 0,
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
