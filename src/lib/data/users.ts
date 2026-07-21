import { cache } from "react";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import Post from "@/models/Post";

/**
 * Look up a public profile by username (case-insensitive).
 *
 * Wrapped in React `cache()` so `generateMetadata` and the page component share
 * a SINGLE database query per request — instead of each making its own
 * (previously each did a full HTTP round-trip to our own API route).
 */
export const getProfileByUsername = cache(async (username: string) => {
  await connectToDatabase();
  // Match the current handle OR a retired one (previousUsername), so an old
  // /{username} link still resolves to the user and the page can 301 to their
  // current handle. Retired handles are reserved (never reassigned), so there
  // is no ambiguity between the two.
  return User.findOne({
    $or: [{ username }, { previousUsername: username }],
  })
    .collation({ locale: "en", strength: 2 })
    .select(
      // Email is intentionally NOT selected — a public profile must never expose
      // it (not even masked). It stays accessible to the owner only via Settings.
      "_id name username bio socials image createdAt followersCount followingCount bookmarksCount",
    )
    .lean();
});

/** First page (6) of a user's posts, newest first — queried directly. */
export async function getUserPostsByUserId(userId: unknown) {
  await connectToDatabase();
  return Post.find({ creator: userId })
    .select("title excerpt slug image tags date creator")
    .populate("creator", "username")
    .sort({ date: -1, _id: -1 })
    .limit(6)
    .lean();
}

/** Total number of posts by a user — for the profile post count. */
export async function getUserPostsCount(userId: unknown): Promise<number> {
  await connectToDatabase();
  return Post.countDocuments({ creator: userId });
}
