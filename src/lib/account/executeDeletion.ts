import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import Post from "@/models/Post";
import Comment from "@/models/Comment";
import PostView from "@/models/PostView";
import Like from "@/models/Like";
import Bookmark from "@/models/Bookmark";
import Follow from "@/models/Follow";
import { Subscription } from "@/models/Subscription";
import cloudinary from "@/lib/cloudinary";
import { sendEmail } from "@/lib/email/send";
import { accountDeletionCompletedEmail } from "@/lib/email/templates";

export type DeletionResult = {
  userId: string;
  postsDeleted: number;
  commentsDeleted: number;
  imagesDeleted: number;
  failures: string[];
};

/**
 * Permanently delete a user and all their data. Idempotent — running twice
 * is safe (second run finds nothing to delete).
 *
 * Order matters:
 *   1. Cloudinary images first (irreversible, but cheap to retry if it fails)
 *   2. Posts (cascade removes their dependent docs)
 *   3. Comments, likes, bookmarks references
 *   4. User document last (so we can find their data above)
 *
 * If any step throws, we capture it in `failures` and continue. The user
 * doc is only removed if everything else succeeded — otherwise we leave the
 * deletion record so an operator can retry.
 */
export async function executeUserDeletion(userId: string): Promise<DeletionResult> {
  const result: DeletionResult = {
    userId,
    postsDeleted: 0,
    commentsDeleted: 0,
    imagesDeleted: 0,
    failures: [],
  };

  await connectToDatabase();

  const user = await User.findById(userId);
  if (!user) {
    result.failures.push("User not found");
    return result;
  }
  if (!user.deletionScheduledFor) {
    result.failures.push("Deletion not scheduled");
    return result;
  }

  // 1. Delete Cloudinary images for this user's posts.
  const userPosts = await Post.find({ creator: userId }).select(
    "_id imagePublicId",
  );
  for (const p of userPosts) {
    if (p.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(p.imagePublicId);
        result.imagesDeleted += 1;
      } catch (err: any) {
        result.failures.push(
          `Cloudinary destroy failed for ${p.imagePublicId}: ${err?.message}`,
        );
      }
    }
  }
  const postIds = userPosts.map((p) => p._id);

  // 2. Delete all comments + their replies on this user's posts.
  if (postIds.length > 0) {
    try {
      const r = await Comment.deleteMany({ postId: { $in: postIds } });
      result.commentsDeleted += r.deletedCount ?? 0;
    } catch (err: any) {
      result.failures.push(`Comments on posts cleanup failed: ${err?.message}`);
    }

    // Drop view-dedup records — no longer needed.
    try {
      await PostView.deleteMany({ postId: { $in: postIds } });
    } catch (err: any) {
      result.failures.push(`PostView cleanup failed: ${err?.message}`);
    }
  }

  // 3. Delete comments authored by this user on other peoples' posts.
  try {
    const r = await Comment.deleteMany({ userId });
    result.commentsDeleted += r.deletedCount ?? 0;
  } catch (err: any) {
    result.failures.push(`Comments authored cleanup failed: ${err?.message}`);
  }

  // 4. Delete the user's own posts.
  if (postIds.length > 0) {
    try {
      const r = await Post.deleteMany({ creator: userId });
      result.postsDeleted = r.deletedCount ?? 0;
    } catch (err: any) {
      result.failures.push(`Posts cleanup failed: ${err?.message}`);
    }
  }

  // 5. Clean up this user's relations in the dedicated collections — Like /
  //    Bookmark / Follow are standalone documents, NOT embedded arrays — and
  //    reconcile the denormalized counters they feed, so other users' and
  //    posts' totals don't drift after this account is removed.

  // 5a. Likes this user gave → decrement those posts' likesCount, then remove
  //     the Like docs. (Likes on this user's own posts are cleared in 5e.)
  try {
    const likedPostIds = await Like.find({ user: user._id }).distinct("post");
    if (likedPostIds.length > 0) {
      await Post.updateMany(
        { _id: { $in: likedPostIds } },
        { $inc: { likesCount: -1 } },
      );
    }
    await Like.deleteMany({ user: user._id });
  } catch (err: any) {
    result.failures.push(`Likes-by-user cleanup failed: ${err?.message}`);
  }

  // 5b. Bookmarks this user made → decrement those posts' bookmarksCount, then
  //     remove the Bookmark docs.
  try {
    const bookmarkedPostIds = await Bookmark.find({
      user: user._id,
    }).distinct("post");
    if (bookmarkedPostIds.length > 0) {
      await Post.updateMany(
        { _id: { $in: bookmarkedPostIds } },
        { $inc: { bookmarksCount: -1 } },
      );
    }
    await Bookmark.deleteMany({ user: user._id });
  } catch (err: any) {
    result.failures.push(`Bookmarks-by-user cleanup failed: ${err?.message}`);
  }

  // 5c. Users who followed this user → decrement each of their followingCount,
  //     then remove those Follow docs.
  try {
    const followerIds = await Follow.find({
      following: user._id,
    }).distinct("follower");
    if (followerIds.length > 0) {
      await User.updateMany(
        { _id: { $in: followerIds } },
        { $inc: { followingCount: -1 } },
      );
    }
    await Follow.deleteMany({ following: user._id });
  } catch (err: any) {
    result.failures.push(`Followers cleanup failed: ${err?.message}`);
  }

  // 5d. Users this user followed → decrement each of their followersCount,
  //     then remove those Follow docs.
  try {
    const followingIds = await Follow.find({
      follower: user._id,
    }).distinct("following");
    if (followingIds.length > 0) {
      await User.updateMany(
        { _id: { $in: followingIds } },
        { $inc: { followersCount: -1 } },
      );
    }
    await Follow.deleteMany({ follower: user._id });
  } catch (err: any) {
    result.failures.push(`Following cleanup failed: ${err?.message}`);
  }

  // 5e. Likes & bookmarks OTHERS placed on this user's (now deleted) posts →
  //     remove the orphaned docs and reconcile the bookmarkers' counts.
  if (postIds.length > 0) {
    try {
      await Like.deleteMany({ post: { $in: postIds } });
    } catch (err: any) {
      result.failures.push(`Likes-on-posts cleanup failed: ${err?.message}`);
    }
    try {
      // Each bookmarker's User.bookmarksCount drops by how many of this user's
      // posts they had bookmarked.
      const grouped = await Bookmark.aggregate([
        { $match: { post: { $in: postIds } } },
        { $group: { _id: "$user", n: { $sum: 1 } } },
      ]);
      for (const g of grouped) {
        await User.updateOne(
          { _id: g._id },
          { $inc: { bookmarksCount: -g.n } },
        );
      }
      await Bookmark.deleteMany({ post: { $in: postIds } });
    } catch (err: any) {
      result.failures.push(`Bookmarks-on-posts cleanup failed: ${err?.message}`);
    }
  }

  // 6. Archive subscription records (keep for financial audit, but anonymize).
  try {
    await Subscription.updateMany(
      { user: user._id },
      {
        $set: {
          status: "canceled",
          canceledAt: new Date(),
        },
      },
    );
  } catch (err: any) {
    result.failures.push(`Subscription archive failed: ${err?.message}`);
  }

  // 7. Send completion email BEFORE deleting the user doc.
  try {
    const tpl = accountDeletionCompletedEmail({ name: user.name });
    await sendEmail({
      to: user.email,
      subject: tpl.subject,
      html: tpl.html,
      tag: "account-deletion-completed",
    });
  } catch (err: any) {
    result.failures.push(`Completion email failed: ${err?.message}`);
  }

  // 8. Finally, delete the user document. Only if no critical failures.
  // If we have failures, leave the user doc with deletionScheduledFor still
  // set so the next cron run can retry the failing pieces.
  if (result.failures.length === 0) {
    try {
      await User.deleteOne({ _id: user._id });
    } catch (err: any) {
      result.failures.push(`User delete failed: ${err?.message}`);
    }
  } else {
    console.warn(
      `[account-delete] retaining user ${userId} due to ${result.failures.length} failures`,
    );
  }

  return result;
}
