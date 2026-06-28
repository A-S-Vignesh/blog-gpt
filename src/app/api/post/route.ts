import { connectToDatabase } from "@/lib/mongodb";
import Post from "@/models/Post";
import { NextRequest, NextResponse } from "next/server";
import "@/models/User";
import { withCache } from "@/lib/api/cache";

export const GET = async (req: NextRequest) => {
  try {
    await connectToDatabase();

    const url = req.nextUrl;
    const skipParam = url.searchParams.get("skip");
    const searchParam = url.searchParams.get("search")?.trim();
    const tagParam = url.searchParams.get("tag")?.trim();

    // Legacy path to fetch all posts at once, used only where explicitly requested.
    if (skipParam === "all") {
      const allPosts = await Post.find({}).populate("creator", "username name image");
      return new Response(JSON.stringify(allPosts), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const skipValue = parseInt(skipParam || "0", 10);
    if (isNaN(skipValue) || skipValue < 0) {
      return new Response(
        JSON.stringify({ error: "Invalid skip parameter" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const query: Record<string, any> = {};

    if (tagParam) {
      query.tags = tagParam;
    }

    if (searchParam) {
      const escaped = searchParam.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      query.$or = [
        { title: regex },
        { excerpt: regex },
        { tags: regex },
      ];
    }

    const [response, postLength] = await Promise.all([
      Post.find(query)
        .select(
          "title excerpt slug image tags date creator readingTime likesCount commentsCount",
        )
        .populate("creator", "username name image")
        .sort({ updatedAt: -1, date: -1 })
        .skip(skipValue)
        .limit(6)
        .lean()
        .exec(),
      Post.countDocuments(query),
    ]);

    const data = response.map((post: any) => ({
      ...post,
      likesCount: post.likesCount ?? 0,
      commentsCount: post.commentsCount ?? 0,
    }));

    // Search/tag-filtered results vary by query string — these are still
    // cacheable at the edge (URL is the cache key) but with a shorter TTL.
    const profile = searchParam || tagParam ? "short" : "medium";
    return withCache(
      NextResponse.json({
        data,
        page: {
          remaining: Math.max(postLength - (skipValue + 6), 0),
          nextPage: skipValue + 6,
        },
      }),
      profile,
    );
  } catch (error: any) {
    console.error("Error fetching posts:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch the Posts",
        details: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
