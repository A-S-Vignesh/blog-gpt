import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Post from "@/models/Post";
import { User } from "@/models/User";
import { cachedJson } from "@/lib/api/cache";

const PAGE_SIZE = 6;

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const url = request.nextUrl;
    const skipParam = url.searchParams.get("skip");
    const limitParam = url.searchParams.get("limit");

    const skip = Math.max(0, parseInt(skipParam || "0", 10) || 0);
    const limit = Math.min(
      20,
      Math.max(1, parseInt(limitParam || String(PAGE_SIZE), 10) || PAGE_SIZE),
    );

    const [posts, total] = await Promise.all([
      Post.find({ status: "published" })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select(
          "title excerpt slug image tags date creator readingTime likesCount commentsCount createdAt",
        )
        .populate({
          path: "creator",
          select: "_id name username image",
          model: User,
        })
        .lean(),
      Post.countDocuments({ status: "published" }),
    ]);

    const data = (posts as any[]).map((post) => ({
      ...post,
      likesCount: post.likesCount ?? 0,
      commentsCount: post.commentsCount ?? 0,
    }));

    return cachedJson(
      {
        data,
        page: {
          remaining: Math.max(total - (skip + limit), 0),
          nextPage: skip + limit,
        },
      },
      "short",
    );
  } catch (error) {
    console.error("❌ GET RECENT POSTS ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 },
    );
  }
}
