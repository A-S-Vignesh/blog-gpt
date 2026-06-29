import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import Post from "@/models/Post";
import Comment from "@/models/Comment";
import { Types } from "mongoose";
import sanitizeHtml from "sanitize-html";
import { NextResponse } from "next/server";
import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { rateLimit } from "@/lib/rateLimit";
import { checkCommentSpam } from "@/lib/comments/spamCheck";
import { revalidateTag } from "next/cache";
import { postDetailTag } from "@/lib/data/posts";

const MAX_DEPTH = 5;

// Strip ALL HTML — comments are plain text only.
const COMMENT_SANITIZE: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
  textFilter: (text) => text,
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    await connectToDatabase();

    const post = await Post.findOne({ slug }).select("_id");
    if (!post) {
      throw new ApiError("NOT_FOUND", "Post not found.");
    }

    const url = new URL(req.url);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)),
    );
    const cursor = url.searchParams.get("cursor");

    // `?parent=<commentId>` → fetch replies under that comment.
    // No `parent` → fetch root-level comments.
    const parentParam = url.searchParams.get("parent");
    let parentFilter: Types.ObjectId | null = null;
    if (parentParam) {
      if (!Types.ObjectId.isValid(parentParam)) {
        throw new ApiError("BAD_REQUEST", "Invalid parent id.");
      }
      parentFilter = new Types.ObjectId(parentParam);
    }

    const query: Record<string, unknown> = {
      postId: post._id,
      parentCommentId: parentFilter, // null for roots, ObjectId for replies
    };
    if (cursor && Types.ObjectId.isValid(cursor)) {
      query._id = { $lt: new Types.ObjectId(cursor) };
    }

    const comments = await Comment.find(query)
      .populate("userId", "name username image")
      .sort({ _id: parentFilter ? 1 : -1 }) // replies oldest-first, roots newest-first
      .limit(limit + 1)
      .lean();

    const hasMore = comments.length > limit;
    const slice = hasMore ? comments.slice(0, limit) : comments;
    const nextCursor = hasMore ? String(slice[slice.length - 1]._id) : null;

    // Attach `replyCount` to each comment in this slice so the UI can show
    // "View N replies" without a separate round-trip per comment.
    const ids = slice.map((c: any) => c._id);
    const counts = ids.length
      ? await Comment.aggregate([
          { $match: { parentCommentId: { $in: ids } } },
          { $group: { _id: "$parentCommentId", count: { $sum: 1 } } },
        ])
      : [];
    const countMap = new Map<string, number>(
      counts.map((r: any) => [String(r._id), r.count]),
    );

    const withCounts = slice.map((c: any) => ({
      ...c,
      replyCount: countMap.get(String(c._id)) ?? 0,
    }));

    return NextResponse.json({ data: withCounts, nextCursor });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      throw new ApiError(
        "UNAUTHENTICATED",
        "You must be signed in to comment.",
      );
    }
    const userId = session.user._id;

    const rl = await rateLimit({
      key: `comment:${userId}`,
      windowMs: 60_000,
      max: 5,
    });
    if (!rl.ok) {
      throw new ApiError(
        "RATE_LIMITED",
        "You are commenting too quickly. Please wait a moment.",
        { retryAfterSeconds: rl.retryAfterSeconds },
      );
    }

    const dayLimit = await rateLimit({
      key: `comment:day:${userId}`,
      windowMs: 24 * 60 * 60 * 1000,
      max: 100,
    });
    if (!dayLimit.ok) {
      throw new ApiError(
        "RATE_LIMITED",
        "Daily comment limit reached.",
        { retryAfterSeconds: dayLimit.retryAfterSeconds },
      );
    }

    const body = (await req.json().catch(() => null)) as {
      content?: string;
      parentCommentId?: string | null;
    } | null;
    if (!body || typeof body.content !== "string") {
      throw new ApiError("BAD_REQUEST", "Missing comment content.");
    }

    const sanitized = sanitizeHtml(body.content, COMMENT_SANITIZE).trim();
    const spam = checkCommentSpam(sanitized);
    if (!spam.ok) {
      throw new ApiError(
        "VALIDATION_FAILED",
        `Comment rejected: ${spam.reason}.`,
      );
    }

    await connectToDatabase();

    const post = await Post.findOne({ slug }).select("_id allowComments");
    if (!post) {
      throw new ApiError("NOT_FOUND", "Post not found.");
    }

    // Owner has turned comments off (undefined == legacy/allowed).
    if (post.allowComments === false) {
      throw new ApiError(
        "FORBIDDEN",
        "Comments are turned off for this post.",
      );
    }

    // Threading: validate parent and compute depth.
    let depth = 0;
    let parentId: Types.ObjectId | null = null;
    if (body.parentCommentId) {
      if (!Types.ObjectId.isValid(body.parentCommentId)) {
        throw new ApiError("BAD_REQUEST", "Invalid parent comment id.");
      }
      const parent = await Comment.findById(body.parentCommentId).select(
        "_id postId depth",
      );
      if (!parent) {
        throw new ApiError("NOT_FOUND", "Parent comment not found.");
      }
      if (parent.postId.toString() !== post._id.toString()) {
        throw new ApiError(
          "BAD_REQUEST",
          "Parent comment belongs to a different post.",
        );
      }
      if ((parent.depth ?? 0) >= MAX_DEPTH) {
        throw new ApiError(
          "BAD_REQUEST",
          "Comment thread is too deep. Reply to a parent instead.",
        );
      }
      depth = (parent.depth ?? 0) + 1;
      parentId = parent._id as Types.ObjectId;
    }

    const created = await Comment.create({
      postId: post._id,
      postSlug: slug,
      userId,
      content: sanitized,
      parentCommentId: parentId,
      depth,
    });

    // `timestamps: false`: a new comment must not bump the post's `updatedAt`
    // (it is engagement, not a content edit) so feeds/SEO stay stable.
    await Post.updateOne(
      { _id: post._id },
      { $inc: { commentsCount: 1 } },
      { timestamps: false },
    );

    revalidateTag(postDetailTag(slug), "default");

    const populated = await created.populate("userId", "name username image");
    // Newly created comments have zero replies — surface the field so the
    // client doesn't have to guess.
    const responseBody = { ...populated.toObject(), replyCount: 0 };
    return NextResponse.json(responseBody, { status: 201 });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

/**
 * Toggle whether new comments are allowed on a post. Post owner only.
 * Existing comments are left intact — disabling only blocks new ones.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      throw new ApiError("UNAUTHENTICATED", "Sign in required.");
    }

    const body = (await req.json().catch(() => null)) as {
      allowComments?: boolean;
    } | null;
    if (!body || typeof body.allowComments !== "boolean") {
      throw new ApiError(
        "BAD_REQUEST",
        "Missing required field `allowComments` (boolean).",
      );
    }

    await connectToDatabase();

    const post = await Post.findOne({ slug }).select("_id creator");
    if (!post) {
      throw new ApiError("NOT_FOUND", "Post not found.");
    }
    if (post.creator.toString() !== session.user._id) {
      throw new ApiError(
        "FORBIDDEN",
        "Only the post author can change comment settings.",
      );
    }

    await Post.updateOne(
      { _id: post._id },
      { $set: { allowComments: body.allowComments } },
    );

    revalidateTag(postDetailTag(slug), "default");

    return NextResponse.json({
      success: true,
      allowComments: body.allowComments,
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
