import { unstable_cache } from "next/cache";
import { connectToDatabase } from "@/lib/mongodb";
import Post from "@/models/Post";
import Comment from "@/models/Comment";
import { User } from "@/models/User";
import type { PopulatedClientPost } from "@/types/post";

export const POST_LIST_TAG = "posts:list";
export const postDetailTag = (slug: string) => `posts:detail:${slug}`;
export const postRelatedTag = (slug: string) => `posts:related:${slug}`;

const PAGE_SIZE = 6;
const LIST_REVALIDATE_SECONDS = 600;
const DETAIL_REVALIDATE_SECONDS = 60;
const RELATED_REVALIDATE_SECONDS = 600;

type PaginatedPostsArgs = {
  skip: number;
  search?: string;
  tag?: string;
};

type PaginatedPostsResult = {
  data: PopulatedClientPost[];
  page: {
    remaining: number;
    nextPage: number;
  };
};

const serialize = <T>(value: T): T => JSON.parse(JSON.stringify(value));

async function fetchPaginatedPosts({
  skip,
  search,
  tag,
}: PaginatedPostsArgs): Promise<PaginatedPostsResult> {
  await connectToDatabase();

  const query: Record<string, unknown> = {
    moderationStatus: { $ne: "flagged" },
  };
  if (tag) {
    query.tags = tag;
  }
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");
    query.$or = [{ title: regex }, { excerpt: regex }, { tags: regex }];
  }

  const [response, totalCount] = await Promise.all([
    Post.find(query)
      .select(
        "title excerpt slug image tags date creator readingTime likesCount commentsCount",
      )
      .populate("creator", "username name image")
      .sort({ updatedAt: -1, date: -1 })
      .skip(skip)
      .limit(PAGE_SIZE)
      .lean()
      .exec(),
    Post.countDocuments(query),
  ]);

  const data = response.map((post: any) => ({
    ...post,
    likesCount: post.likesCount ?? 0,
    commentsCount: post.commentsCount ?? 0,
  }));

  return {
    data: serialize(data) as PopulatedClientPost[],
    page: {
      remaining: Math.max(totalCount - (skip + PAGE_SIZE), 0),
      nextPage: skip + PAGE_SIZE,
    },
  };
}

export const getPaginatedPosts = unstable_cache(
  fetchPaginatedPosts,
  ["paginated-posts"],
  {
    revalidate: LIST_REVALIDATE_SECONDS,
    tags: [POST_LIST_TAG],
  },
);

type PostDetail = PopulatedClientPost & {
  likesCount: number;
  commentsCount: number;
};

async function fetchPostBySlug(
  username: string,
  slug: string,
): Promise<PostDetail | null> {
  await connectToDatabase();

  const usernameLc = username.toLowerCase();
  const slugLc = slug.toLowerCase();

  // Resolve the handle to its owner first — matching the current handle OR a
  // retired one (previousUsername). This lets old /{username}/{slug} links find
  // the post (the page then 301s to the current handle), AND scopes the post
  // lookup to the right user so two authors sharing a slug never collide.
  const owner = await User.findOne({
    $or: [{ username: usernameLc }, { previousUsername: usernameLc }],
  })
    .collation({ locale: "en", strength: 2 })
    .select("_id")
    .lean<{ _id: unknown } | null>();
  if (!owner) return null;

  const post = await Post.findOne({ slug: slugLc, creator: owner._id })
    .populate("creator", "name username image")
    .lean<any>();

  if (!post || post.moderationStatus === "flagged") {
    return null;
  }

  // Counts come from the denormalized fields on Post — kept in sync atomically
  // by the like/comment endpoints (which `countDocuments` after each write).
  const likesCount = post.likesCount ?? 0;
  const commentsCount = post.commentsCount ?? 0;

  return serialize({
    ...post,
    likesCount,
    commentsCount,
  }) as PostDetail;
}

/**
 * Fetch the latest root-level comments for a post.
 *
 * NOT wrapped in `unstable_cache` on purpose — comments need to refresh on
 * every page render so a refresh after posting always shows the new state.
 * Mongoose's lean() + indexed query is fast enough (< 20ms) for this to be
 * inline in SSR without hurting perceived perf.
 */
export async function getPostComments(
  postId: string,
  limit = 20,
): Promise<any[]> {
  if (!postId) return [];
  await connectToDatabase();
  const comments = await Comment.find({
    postId,
    parentCommentId: null,
  })
    .populate("userId", "name username image")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  // Attach reply counts so the client can show "View N replies" on each
  // root comment without making a per-comment request.
  const ids = comments.map((c: any) => c._id);
  const counts = ids.length
    ? await Comment.aggregate([
        { $match: { parentCommentId: { $in: ids } } },
        { $group: { _id: "$parentCommentId", count: { $sum: 1 } } },
      ])
    : [];
  const countMap = new Map<string, number>(
    counts.map((r: any) => [String(r._id), r.count]),
  );

  const withCounts = comments.map((c: any) => ({
    ...c,
    replyCount: countMap.get(String(c._id)) ?? 0,
  }));

  return serialize(withCounts) as any[];
}

export const getPostBySlug = (username: string, slug: string) =>
  unstable_cache(
    () => fetchPostBySlug(username, slug),
    ["post-detail", username, slug],
    {
      revalidate: DETAIL_REVALIDATE_SECONDS,
      tags: [postDetailTag(slug)],
    },
  )();

type RelatedPost = {
  _id: string;
  title: string;
  slug: string;
  image?: string;
  tags?: string[];
  category?: string;
  date?: string;
  excerpt?: string;
  /** Populated so links can use the canonical /{username}/{slug} route. */
  creator?: {
    _id?: string;
    username: string;
    name?: string;
    image?: string;
  };
};

// Shared $lookup stage that brings in `creator.username` so the link target
// resolves to the canonical /{username}/{slug} URL.
const CREATOR_LOOKUP_STAGES = [
  {
    $lookup: {
      from: "users",
      localField: "creator",
      foreignField: "_id",
      as: "creator",
      pipeline: [{ $project: { username: 1, name: 1, image: 1 } }],
    },
  },
  { $unwind: { path: "$creator", preserveNullAndEmptyArrays: true } },
];

const RELATED_PROJECT_STAGE = {
  $project: {
    title: 1,
    slug: 1,
    image: 1,
    tags: 1,
    category: 1,
    date: 1,
    excerpt: 1,
    creator: 1,
  },
};

async function fetchRelatedPosts(slug: string): Promise<RelatedPost[]> {
  await connectToDatabase();

  const currentPost = await Post.findOne({ slug }).lean<any>();
  if (!currentPost) {
    return [];
  }

  const usedSlugs = [slug];
  let relatedPosts: any[] = [];

  if (Array.isArray(currentPost.tags) && currentPost.tags.length > 0) {
    const tagPosts = await Post.aggregate([
      {
        $match: {
          slug: { $nin: usedSlugs },
          tags: { $in: currentPost.tags },
          moderationStatus: { $ne: "flagged" },
        },
      },
      {
        $addFields: {
          commonTags: {
            $size: { $setIntersection: ["$tags", currentPost.tags] },
          },
        },
      },
      { $sort: { commonTags: -1, date: -1 } },
      { $limit: 3 },
      ...CREATOR_LOOKUP_STAGES,
      RELATED_PROJECT_STAGE,
    ]);
    relatedPosts = [...relatedPosts, ...tagPosts];
    usedSlugs.push(...tagPosts.map((p: any) => p.slug));
  }

  if (relatedPosts.length < 3 && currentPost.category) {
    const categoryPosts = await Post.find({
      slug: { $nin: usedSlugs },
      category: currentPost.category,
      moderationStatus: { $ne: "flagged" },
    })
      .sort({ date: -1 })
      .limit(3 - relatedPosts.length)
      .select("title slug image tags category date excerpt creator")
      .populate("creator", "username name image")
      .lean();
    relatedPosts = [...relatedPosts, ...categoryPosts];
    usedSlugs.push(...categoryPosts.map((p: any) => p.slug));
  }

  if (relatedPosts.length < 3) {
    const randomPosts = await Post.aggregate([
      {
        $match: {
          slug: { $nin: usedSlugs },
          moderationStatus: { $ne: "flagged" },
        },
      },
      { $sample: { size: 3 - relatedPosts.length } },
      ...CREATOR_LOOKUP_STAGES,
      RELATED_PROJECT_STAGE,
    ]);
    relatedPosts = [...relatedPosts, ...randomPosts];
  }

  return serialize(relatedPosts) as RelatedPost[];
}

export const getRelatedPosts = (slug: string) =>
  unstable_cache(() => fetchRelatedPosts(slug), ["post-related", slug], {
    revalidate: RELATED_REVALIDATE_SECONDS,
    tags: [postRelatedTag(slug)],
  })();
