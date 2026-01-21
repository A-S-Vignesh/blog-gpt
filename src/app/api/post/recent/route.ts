import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Post from "@/models/Post";
import { User } from "@/models/User";

export async function GET(request: Request) {
  try {
    await connectToDatabase();

    const posts = await Post.find({ status: "published" })
      .sort({ createdAt: -1 }) // newest first
      .limit(10) // recent 10 posts
      .populate({
        path: "creator",
        select: "_id name username image",
        model: User,
      })
      .lean();

    return NextResponse.json({
      success: true,
      posts,
    });
  } catch (error) {
    console.error("❌ GET RECENT POSTS ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}
