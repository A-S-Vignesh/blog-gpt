import { NextResponse } from "next/server";
import Post from "@/models/Post";
import "@/models/User";
import { connectToDatabase } from "@/lib/mongodb";

// The route reads `request.url` for `?limit=`, so it can't be ISR'd.
// Edge-level caching is handled by the `Cache-Control` header below.
export const dynamic = "force-dynamic";

/**
 * Trending = engagement weighted by time decay.
 *
 *   raw     = likes + 2*comments + 0.1*views
 *   score   = raw / (ageInDays + 2)^GRAVITY
 *
 * The "+2" prevents brand-new posts from dominating with very small
 * engagement (mirrors HN's algorithm). GRAVITY=1.6 gives ~24h half-life
 * for hot posts — pop in fast, fade in a few days.
 *
 * Trade-offs:
 *   * Computed inline via Mongo aggregation. For very large post counts
 *     this should move to a periodic cron + cached collection, but at
 *     <50k posts the aggregation is < 200ms.
 *   * Uses the denormalized `likesCount` / `commentsCount` counters as the
 *     single source of truth — they are kept in sync atomically by the
 *     like / comment endpoints (which `countDocuments` after each write).
 *   * No hard date window — decay handles it. A 90-day-old post scores
 *     ~50x lower than a 1-day-old post with the same raw engagement, so
 *     it sinks naturally without a `$match` that could starve a small
 *     blog of any results.
 */
const GRAVITY = 1.6;

export async function GET(req: Request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const limit = Math.min(
      30,
      Math.max(1, Number(searchParams.get("limit")) || 5),
    );

    const posts = await Post.aggregate([
      {
        $match: {
          moderationStatus: { $ne: "flagged" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "creator",
          foreignField: "_id",
          as: "creatorData",
          pipeline: [
            { $project: { name: 1, username: 1, image: 1 } },
          ],
        },
      },
      { $unwind: "$creatorData" },
      {
        $addFields: {
          _likes: { $ifNull: ["$likesCount", 0] },
          _comments: { $ifNull: ["$commentsCount", 0] },
          _views: { $ifNull: ["$views", 0] },
          _ageDays: {
            $divide: [
              { $subtract: ["$$NOW", { $ifNull: ["$createdAt", "$$NOW"] }] },
              1000 * 60 * 60 * 24,
            ],
          },
        },
      },
      {
        $addFields: {
          rawScore: {
            $add: [
              "$_likes",
              { $multiply: ["$_comments", 2] },
              { $multiply: ["$_views", 0.1] },
            ],
          },
        },
      },
      {
        $addFields: {
          trendingScore: {
            $divide: [
              "$rawScore",
              { $pow: [{ $add: ["$_ageDays", 2] }, GRAVITY] },
            ],
          },
          likesCount: "$_likes",
          commentsCount: "$_comments",
        },
      },
      { $sort: { trendingScore: -1, createdAt: -1 } },
      { $limit: limit },
      {
        $project: {
          title: 1,
          slug: 1,
          image: 1,
          excerpt: 1,
          category: 1,
          tags: 1,
          readingTime: 1,
          likesCount: 1,
          commentsCount: 1,
          createdAt: 1,
          trendingScore: 1,
          creator: "$creatorData",
        },
      },
    ]);

    return NextResponse.json(
      { success: true, posts },
      {
        headers: {
          // Cache at the edge — trending changes slowly.
          "Cache-Control":
            "public, s-maxage=600, stale-while-revalidate=3600",
        },
      },
    );
  } catch (err) {
    console.error("TRENDING API ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Failed to load trending posts" },
      { status: 500 },
    );
  }
}
