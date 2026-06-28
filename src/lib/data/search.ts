import { connectToDatabase } from "@/lib/mongodb";
import Post from "@/models/Post";
import "@/models/User";
import type { PopulatedClientPost } from "@/types/post";

const PAGE_SIZE = 12;
const ATLAS_INDEX_NAME = process.env.ATLAS_SEARCH_INDEX || "posts_search";
const USE_ATLAS_SEARCH = process.env.USE_ATLAS_SEARCH === "1";

type SearchArgs = {
  query: string;
  tag?: string;
  skip?: number;
  limit?: number;
};

type SearchResult = {
  data: PopulatedClientPost[];
  page: { remaining: number; nextSkip: number };
  engine: "atlas-search" | "regex";
};

const serialize = <T>(v: T): T => JSON.parse(JSON.stringify(v));

/**
 * Full-text search. Uses Atlas Search ($search) if available, otherwise
 * falls back to indexed regex. Both paths filter out flagged content and
 * return the same response shape.
 *
 * Setup for Atlas Search (one-time, in Atlas dashboard):
 *   1. Open Cluster → Search → "Create Search Index"
 *   2. Pick the `posts` collection
 *   3. Use this JSON config:
 *        {
 *          "mappings": {
 *            "dynamic": false,
 *            "fields": {
 *              "title": { "type": "string" },
 *              "excerpt": { "type": "string" },
 *              "content": { "type": "string" },
 *              "tags": { "type": "string" },
 *              "moderationStatus": { "type": "token" }
 *            }
 *          }
 *        }
 *   4. Name the index `posts_search` (matches ATLAS_SEARCH_INDEX env default)
 *   5. Set `USE_ATLAS_SEARCH=1` in env to switch this code to Atlas mode
 *
 * Regex fallback is fine for < 5k posts; beyond that the fallback gets
 * slow even with the title/excerpt indexes.
 */
export async function searchPosts({
  query,
  tag,
  skip = 0,
  limit = PAGE_SIZE,
}: SearchArgs): Promise<SearchResult> {
  await connectToDatabase();
  const cleanQuery = query.trim();

  if (USE_ATLAS_SEARCH && cleanQuery.length > 0) {
    return atlasSearch({ query: cleanQuery, tag, skip, limit });
  }
  return regexSearch({ query: cleanQuery, tag, skip, limit });
}

async function atlasSearch({
  query,
  tag,
  skip,
  limit,
}: {
  query: string;
  tag?: string;
  skip: number;
  limit: number;
}): Promise<SearchResult> {
  const must: any[] = [
    {
      text: {
        query,
        path: ["title", "excerpt", "content", "tags"],
        fuzzy: { maxEdits: 1, prefixLength: 2 },
      },
    },
  ];
  const filter: any[] = [];
  if (tag) {
    filter.push({ text: { query: tag, path: "tags" } });
  }

  const pipeline: any[] = [
    {
      $search: {
        index: ATLAS_INDEX_NAME,
        compound: { must, filter },
      },
    },
    { $match: { moderationStatus: { $ne: "flagged" } } },
    { $skip: skip },
    { $limit: limit + 1 },
    {
      $lookup: {
        from: "users",
        localField: "creator",
        foreignField: "_id",
        as: "creatorData",
        pipeline: [{ $project: { name: 1, username: 1, image: 1 } }],
      },
    },
    { $unwind: { path: "$creatorData", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        title: 1,
        slug: 1,
        excerpt: 1,
        image: 1,
        tags: 1,
        date: 1,
        readingTime: 1,
        likesCount: 1,
        commentsCount: 1,
        bookmarksCount: 1,
        creator: "$creatorData",
        score: { $meta: "searchScore" },
      },
    },
  ];

  const rows = await Post.aggregate(pipeline);
  const hasMore = rows.length > limit;
  const slice = hasMore ? rows.slice(0, limit) : rows;
  return {
    data: serialize(slice) as PopulatedClientPost[],
    page: {
      remaining: hasMore ? -1 : 0, // total unknown without a count pass
      nextSkip: skip + limit,
    },
    engine: "atlas-search",
  };
}

async function regexSearch({
  query,
  tag,
  skip,
  limit,
}: SearchArgs & { skip: number; limit: number }): Promise<SearchResult> {
  const filter: Record<string, any> = {
    moderationStatus: { $ne: "flagged" },
  };
  if (tag) filter.tags = tag;
  if (query) {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(escaped, "i");
    filter.$or = [{ title: re }, { excerpt: re }, { tags: re }];
  }

  const [rows, total] = await Promise.all([
    Post.find(filter)
      .select(
        "title slug excerpt image tags date readingTime likesCount commentsCount bookmarksCount creator",
      )
      .populate("creator", "name username image")
      .sort({ updatedAt: -1, date: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Post.countDocuments(filter),
  ]);

  return {
    data: serialize(rows) as unknown as PopulatedClientPost[],
    page: {
      remaining: Math.max(total - (skip + limit), 0),
      nextSkip: skip + limit,
    },
    engine: "regex",
  };
}
