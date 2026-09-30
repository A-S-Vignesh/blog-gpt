import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { revalidateTag } from "next/cache";
import { requireAdminMutation } from "@/lib/admin/guard";
import { logAdminAction } from "@/lib/admin/audit";
import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { rateLimit } from "@/lib/rateLimit";
import { connectToDatabase } from "@/lib/mongodb";
import Comment from "@/models/Comment";
import Post from "@/models/Post";
import { postDetailTag } from "@/lib/data/posts";
import { deleteNotificationsForComments } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * Delete a comment and its whole reply subtree, from the moderation table.
 *
 * The public endpoint at /api/comment/[id] already allows an admin to do this,
 * but only from a post page and with no audit trail. This route exists so
 * moderation can happen from the queue and so every removal is logged.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdminMutation(req);
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError("BAD_REQUEST", "Invalid comment id.");
    }

    const rl = await rateLimit({
      key: `admin-comment-delete:${actor.id}`,
      windowMs: 60 * 1000,
      max: 60,
    });
    if (!rl.ok) {
      throw new ApiError("RATE_LIMITED", "Too many deletions.", {
        retryAfterSeconds: rl.retryAfterSeconds,
      });
    }

    const url = new URL(req.url);
    const reason = (url.searchParams.get("reason") || "").slice(0, 500);

    await connectToDatabase();
    const comment = await Comment.findById(id).select(
      "_id content userId postId postSlug",
    );
    if (!comment) {
      throw new ApiError("NOT_FOUND", "Comment not found.");
    }

    // Walk down the reply tree so no orphaned replies survive their parent.
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
      // `timestamps: false`: removing a comment is engagement, not a content
      // edit, so it must not bump the post's updatedAt and reshuffle feeds.
      await Post.updateOne(
        { _id: comment.postId },
        { $inc: { commentsCount: -removed } },
        { timestamps: false },
      );
      await Post.updateOne(
        { _id: comment.postId, commentsCount: { $lt: 0 } },
        { $set: { commentsCount: 0 } },
        { timestamps: false },
      );
    }

    if (comment.postSlug) {
      revalidateTag(postDetailTag(comment.postSlug), "default");
    }

    await logAdminAction({
      actor,
      action: "comment.delete",
      targetType: "comment",
      targetId: id,
      targetLabel: comment.content.slice(0, 80),
      before: {
        content: comment.content,
        postSlug: comment.postSlug,
        repliesRemoved: removed - 1,
      },
      reason,
      req,
    });

    return NextResponse.json({ ok: true, deleted: removed });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
