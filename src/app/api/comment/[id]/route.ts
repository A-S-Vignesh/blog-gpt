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

    const deleteRes = await Comment.deleteMany({
      _id: { $in: Array.from(ids).map((s) => new Types.ObjectId(s)) },
    });
    const removed = deleteRes.deletedCount ?? 0;
    if (removed > 0) {
      await Post.updateOne(
        { _id: comment.postId },
        { $inc: { commentsCount: -removed } },
      );
      // Clamp at 0 in case of negative drift.
      await Post.updateOne(
        { _id: comment.postId, commentsCount: { $lt: 0 } },
        { $set: { commentsCount: 0 } },
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
