import { NextResponse } from "next/server";
import Post from "@/models/Post";
import {User} from "@/models/User";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(req: Request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit")) || 5;

    const posts = await Post.aggregate([
      // Lookup comments count
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "postId",
          as: "commentsData",
        },
      },

      // Lookup creator basic info
      {
        $lookup: {
          from: "users",
          localField: "creator",
          foreignField: "_id",
          as: "creatorData",
          pipeline: [
            {
              $project: {
                name: 1,
                username: 1,
                image: 1,
              },
            },
          ],
        },
      },

      // Flatten creator object
      { $unwind: "$creatorData" },

      // Add computed values
      {
        $addFields: {
          likesCount: { $size: { $ifNull: ["$likes", []] } },
          commentsCount: { $size: { $ifNull: ["$commentsData", []] } },
          trendingScore: {
            $add: [
              { $multiply: [{ $ifNull: ["$views", 0] }, 0.4] },
              { $multiply: [{ $size: { $ifNull: ["$likes", []] } }, 2] },
              {
                $multiply: [{ $size: { $ifNull: ["$commentsData", []] } }, 1.5],
              },
            ],
          },
        },
      },

      // Sort by trending score
      { $sort: { trendingScore: -1, createdAt: -1 } },

      // Limit posts
      { $limit: limit },

      // FINAL projected fields (lightweight!)
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
          creator: "$creatorData",
        },
      },
    ]);

    return NextResponse.json({ success: true, posts });
  } catch (err) {
    console.error("TRENDING API ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Failed to load trending posts" },
      { status: 500 }
    );
  }
}
