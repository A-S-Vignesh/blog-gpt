import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { revalidateTag, revalidatePath } from "next/cache";
import { requireAdminMutation } from "@/lib/admin/guard";
import { logAdminAction } from "@/lib/admin/audit";
import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { rateLimit } from "@/lib/rateLimit";
import { connectToDatabase } from "@/lib/mongodb";
import Post from "@/models/Post";
import Comment from "@/models/Comment";
import Like from "@/models/Like";
import Bookmark from "@/models/Bookmark";
import Share from "@/models/Share";
import PostView from "@/models/PostView";
import { User } from "@/models/User";
import cloudinary from "@/lib/cloudinary";
import {
  POST_LIST_TAG,
  postDetailTag,
  postRelatedTag,
} from "@/lib/data/posts";

export const dynamic = "force-dynamic";

/** Drop every cached view that could still show the post. */
function purgePostCaches(slug: string, username?: string) {
  revalidateTag(POST_LIST_TAG, "default");
  revalidateTag(postDetailTag(slug), "default");
  revalidateTag(postRelatedTag(slug), "default");
  revalidatePath("/explore");
  if (username) {
    revalidatePath(`/${username}/${slug}`);
    revalidatePath(`/${username}`);
  }
}

/**
 * Moderate a post: approve it, flag it, or unpublish it.
 *
 * This is the screen the AI moderation pass has been waiting for — see the
 * note in src/lib/ai/moderation.ts about flagged posts being "reviewed by
 * admins after the fact". Until now nothing could act on `moderationStatus`.
 *
 * Body: { action: "approve" | "flag" | "unpublish", reason?: string }
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdminMutation(req);
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError("BAD_REQUEST", "Invalid post id.");
    }

    // Bound how fast a compromised admin session can churn through content.
    const rl = await rateLimit({
      key: `admin-post-patch:${actor.id}`,
      windowMs: 60 * 1000,
      max: 60,
    });
    if (!rl.ok) {
      throw new ApiError("RATE_LIMITED", "Too many moderation actions.", {
        retryAfterSeconds: rl.retryAfterSeconds,
      });
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action;
    const reason = typeof body?.reason === "string" ? body.reason.slice(0, 500) : "";

    if (action !== "approve" && action !== "flag" && action !== "unpublish") {
      throw new ApiError(
        "BAD_REQUEST",
        'action must be one of "approve", "flag", or "unpublish".',
      );
    }

    await connectToDatabase();
    const post = await Post.findById(id)
      .select("title slug status moderationStatus moderationReason creator")
      .populate("creator", "username");
    if (!post) {
      throw new ApiError("NOT_FOUND", "Post not found.");
    }

    const before = {
      status: post.status,
      moderationStatus: post.moderationStatus,
      moderationReason: post.moderationReason,
    };

    const update: Record<string, unknown> = { moderationCheckedAt: new Date() };
    if (action === "approve") {
      update.moderationStatus = "approved";
      update.moderationReason = "";
    } else if (action === "flag") {
      update.moderationStatus = "flagged";
      update.moderationReason = reason || "Flagged by admin review.";
    } else {
      // Unpublish keeps the post and its moderation verdict intact — it only
      // pulls it out of public view, so the author can still see and fix it.
      update.status = "draft";
      update.moderationStatus = "flagged";
      update.moderationReason = reason || "Unpublished by admin review.";
    }

    await Post.updateOne({ _id: post._id }, { $set: update }, { timestamps: false });

    const username = (post.creator as any)?.username as string | undefined;
    purgePostCaches(post.slug, username);

    await logAdminAction({
      actor,
      action:
        action === "approve"
          ? "post.approve"
          : action === "flag"
            ? "post.flag"
            : "post.unpublish",
      targetType: "post",
      targetId: String(post._id),
      targetLabel: post.title,
      before,
      after: update,
      reason,
      req,
    });

    return NextResponse.json({ ok: true, action, id: String(post._id) });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

/**
 * Permanently delete a post and everything that pointed at it.
 *
 * Unlike the author-facing delete (api/post/[username]/[slug]), this cascades
 * the engagement collections. An admin removes a post precisely because it
 * should stop existing; leaving its comments, likes, bookmarks, views, and
 * share rows behind would keep it counted in every user's bookmark list and
 * in aggregate stats forever.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdminMutation(req);
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError("BAD_REQUEST", "Invalid post id.");
    }

    const rl = await rateLimit({
      key: `admin-post-delete:${actor.id}`,
      windowMs: 60 * 1000,
      max: 20,
    });
    if (!rl.ok) {
      throw new ApiError("RATE_LIMITED", "Too many deletions.", {
        retryAfterSeconds: rl.retryAfterSeconds,
      });
    }

    const url = new URL(req.url);
    const reason = (url.searchParams.get("reason") || "").slice(0, 500);

    await connectToDatabase();
    const post = await Post.findById(id)
      .select("title slug status imagePublicId creator")
      .populate("creator", "username");
    if (!post) {
      throw new ApiError("NOT_FOUND", "Post not found.");
    }

    const postId = post._id as Types.ObjectId;
    const username = (post.creator as any)?.username as string | undefined;

    // Bookmarks carry a denormalized counter on the owning user, so collect the
    // owners before the rows are gone and decrement them afterwards. The
    // (user, post) unique index guarantees at most one row per user, so a flat
    // -1 per user is exact.
    const bookmarkOwners = await Bookmark.find({ post: postId })
      .select("user")
      .lean<{ user: Types.ObjectId }[]>();

    await Promise.all([
      Comment.deleteMany({ postId }),
      Like.deleteMany({ post: postId }),
      Bookmark.deleteMany({ post: postId }),
      Share.deleteMany({ post: postId }),
      PostView.deleteMany({ postId }),
    ]);

    if (bookmarkOwners.length > 0) {
      await User.updateMany(
        {
          _id: { $in: bookmarkOwners.map((b) => b.user) },
          bookmarksCount: { $gt: 0 },
        },
        { $inc: { bookmarksCount: -1 } },
        { timestamps: false },
      );
    }

    // Best-effort: a stale Cloudinary asset is far less bad than a failed
    // delete that leaves the post live, so this must not throw the request.
    if (post.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(post.imagePublicId);
      } catch (err) {
        console.error("[admin] cloudinary destroy failed:", err);
      }
    }

    await Post.deleteOne({ _id: postId });
    purgePostCaches(post.slug, username);

    await logAdminAction({
      actor,
      action: "post.delete",
      targetType: "post",
      targetId: String(postId),
      targetLabel: post.title,
      before: {
        title: post.title,
        slug: post.slug,
        status: post.status,
        author: username ?? null,
      },
      reason,
      req,
    });

    return NextResponse.json({ ok: true, id: String(postId) });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
