import { connectToDatabase } from "@/lib/mongodb";
import Bookmark from "@/models/Bookmark";
import "@/models/Post";
import "@/models/User";

const PAGE_SIZE = 12;

export type BookmarkedItem = {
  _id: string;
  bookmarkedAt: string;
  post: {
    _id: string;
    title: string;
    slug: string;
    image?: string;
    excerpt?: string;
    tags: string[];
    date?: string;
    readingTime?: number;
    likesCount: number;
    commentsCount: number;
    creator: {
      _id: string;
      username: string;
      name: string;
      image?: string;
    };
  };
};

export type BookmarksPage = {
  data: BookmarkedItem[];
  page: {
    hasMore: boolean;
    nextSkip: number;
  };
};

const serialize = <T>(v: T): T => JSON.parse(JSON.stringify(v));

/**
 * Fetch a paginated slice of a user's bookmarks, newest first.
 *
 * Skips bookmarks whose underlying post has been deleted or moderation-flagged
 * — but it counts those toward `skip`, which means a paginated cursor can
 * shrink as pages are fetched. That's fine for "Load more" UX; if we ever
 * need a stable cursor we'd switch to time-based pagination.
 */
export async function getUserBookmarks(
  userId: string,
  options: { skip?: number; limit?: number } = {},
): Promise<BookmarksPage> {
  const skip = Math.max(0, options.skip ?? 0);
  const limit = Math.min(50, Math.max(1, options.limit ?? PAGE_SIZE));

  if (!userId) {
    return { data: [], page: { hasMore: false, nextSkip: skip } };
  }

  await connectToDatabase();

  // Fetch one extra so we can tell if there's another page without a count().
  const raw = await Bookmark.find({ user: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit + 1)
    .populate({
      path: "post",
      select:
        "title slug image excerpt tags date readingTime likesCount commentsCount creator moderationStatus",
      populate: { path: "creator", select: "username name image" },
    })
    .lean<any[]>();

  // Drop bookmarks whose post was deleted (post=null) or flagged.
  const cleaned = raw.filter(
    (b: any) =>
      b.post &&
      b.post.moderationStatus !== "flagged" &&
      b.post.creator?.username,
  );

  const hasMore = cleaned.length > limit;
  const slice = hasMore ? cleaned.slice(0, limit) : cleaned;

  const data: BookmarkedItem[] = slice.map((b: any) => ({
    _id: String(b._id),
    bookmarkedAt: new Date(b.createdAt).toISOString(),
    post: {
      _id: String(b.post._id),
      title: b.post.title,
      slug: b.post.slug,
      image: b.post.image ?? undefined,
      excerpt: b.post.excerpt ?? undefined,
      tags: Array.isArray(b.post.tags) ? b.post.tags : [],
      date: b.post.date,
      readingTime: b.post.readingTime,
      likesCount: b.post.likesCount ?? 0,
      commentsCount: b.post.commentsCount ?? 0,
      creator: {
        _id: String(b.post.creator._id),
        username: b.post.creator.username,
        name: b.post.creator.name,
        image: b.post.creator.image ?? undefined,
      },
    },
  }));

  return serialize({
    data,
    page: {
      hasMore,
      // We advance by the requested limit so duplicate documents aren't
      // returned even when some were filtered out for being deleted/flagged.
      nextSkip: skip + limit,
    },
  });
}
