import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import Like from "@/models/Like";
import Bookmark from "@/models/Bookmark";
import Follow from "@/models/Follow";

/**
 * Per-user/post engagement state for SSR hydration.
 *
 * These are intentionally NOT wrapped in `unstable_cache` because the result
 * varies per signed-in user — caching across users would leak state. The
 * lookups are single indexed `exists()` calls (< 5ms each).
 */
export async function getUserPostState(
  userId: string | null | undefined,
  postId: string | Types.ObjectId,
): Promise<{ liked: boolean; bookmarked: boolean }> {
  if (!userId) return { liked: false, bookmarked: false };

  await connectToDatabase();

  const [liked, bookmarked] = await Promise.all([
    Like.exists({ user: userId, post: postId }),
    Bookmark.exists({ user: userId, post: postId }),
  ]);

  return {
    liked: Boolean(liked),
    bookmarked: Boolean(bookmarked),
  };
}

export async function getUserFollowState(
  viewerId: string | null | undefined,
  targetUserId: string | Types.ObjectId,
): Promise<{ following: boolean }> {
  if (!viewerId) return { following: false };
  if (String(viewerId) === String(targetUserId)) {
    return { following: false };
  }

  await connectToDatabase();
  const exists = await Follow.exists({
    follower: viewerId,
    following: targetUserId,
  });
  return { following: Boolean(exists) };
}
