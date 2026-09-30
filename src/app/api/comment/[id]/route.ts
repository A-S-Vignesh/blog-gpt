import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import Comment from "@/models/Comment";
import Post from "@/models/Post";
import { Types } from "mongoose";
import { NextResponse } from "next/server";
import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { revalidateTag } from "next/cache";
import { postDetailTag } from "@/lib/data/posts";
import { deleteNotificationsForComments } from "@/lib/notifications";

/**
 * One comment on its own, for deep links (`/{user}/{slug}#comment-<id>`, used
 * by notifications) whose target the post page didn't render: an older
 * comment past the first page, or a reply inside a collapsed thread.
 * Comments are public, so no session is required.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError("BAD_REQUEST", "Invalid comment id.");
    }

    await connectToDatabase();

    const comment = await Comment.findById(id)
      .populate("userId", "name username image")
      .lean<any>();
    if (!comment || !comment.userId) {
      throw new ApiError("NOT_FOUND", "Comment not found.");
    }

    const [replyCount, parent] = await Promise.all([
      Comment.countDocuments({ parentCommentId: comment._id }),
      comment.parentCommentId
        ? Comment.findById(comment.parentCommentId)
            .select("content userId")
            .populate("userId", "username")
            .lean<any>()
        : null,
    ]);

    return NextResponse.json({
      comment: { ...comment, replyCount },
      parent: parent
        ? {
            _id: String(parent._id),
            username: parent.userId?.username ?? null,
            content: String(parent.content ?? "").slice(0, 200),
          }
        : null,
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError("BAD_REQUEST", "Invalid comment id.");
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      throw new ApiError("UNAUTHENTICATED", "Sign in required.");
    }

    await connectToDatabase();

    const comment = await Comment.findById(id).select("_id userId postId postSlug");
    if (!comment) {
      throw new ApiError("NOT_FOUND", "Comment not found.");
    }

    // Authorization: comment author OR the post author OR an admin.
    const post = await Post.findById(comment.postId).select("creator");
    const isCommentAuthor = comment.userId.toString() === session.user._id;
    const isPostAuthor =
      post && post.creator.toString() === session.user._id;
    const isAdmin = (session.user as any).role === "admin";

    if (!isCommentAuthor && !isPostAuthor && !isAdmin) {
      throw new ApiError(
        "FORBIDDEN",
        "You can only delete your own comments, or comments on your posts.",
      );
    }

    // Delete the comment and all its descendants (replies).
    const ids = new Set<string>([id]);
    let frontier: Types.ObjectId[] = [comment._id as Types.ObjectId];
    while (frontier.length > 0) {
      const children = await Comment.find({
        parentCommentId: { $in: frontier },
      }).select("_id");
      if (children.length === 0) break;
      frontier = children.map((c) => c._id as Types.ObjectId);
      for (const c of children) ids.add(String(c._id));
    }

    const idList = Array.from(ids).map((s) => new Types.ObjectId(s));
    const deleteRes = await Comment.deleteMany({ _id: { $in: idList } });
    const removed = deleteRes.deletedCount ?? 0;
    await deleteNotificationsForComments(idList);
    if (removed > 0) {
      // `timestamps: false`: deleting a comment is engagement, not a content
      // edit, so it must not bump the post's `updatedAt`.
      await Post.updateOne(
        { _id: comment.postId },
        { $inc: { commentsCount: -removed } },
        { timestamps: false },
      );
      // Clamp at 0 in case of negative drift.
      await Post.updateOne(
        { _id: comment.postId, commentsCount: { $lt: 0 } },
        { $set: { commentsCount: 0 } },
        { timestamps: false },
      );
    }

    if (comment.postSlug) {
      revalidateTag(postDetailTag(comment.postSlug), "default");
    }

    return NextResponse.json({ ok: true, deleted: removed });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
