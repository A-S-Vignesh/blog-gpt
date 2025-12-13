import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Post from "@/models/Post";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectToDatabase();

    const {slug} = await params;

    // Increment views safely
    const updatedPost = await Post.findOneAndUpdate(
      { slug },
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!updatedPost) {
      return NextResponse.json(
        { success: false, message: "Post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, views: updatedPost.views });
  } catch (error) {
    console.error("VIEW ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to increment views" },
      { status: 500 }
    );
  }
}
