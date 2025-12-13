import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import Post from "@/models/Post";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ username: string; slug: string }> }
) {
  try {
    const { username, slug } = await params;

    await connectToDatabase();
    const session = await getServerSession(authOptions);

    if (!session?.user?._id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user._id;

    // 1️⃣ Find post AND verify username match
    const post = await Post.findOne({ slug }).populate("creator", "username");

    if (!post || post.creator.username !== username) {
      return NextResponse.json(
        { success: false, message: "Post not found" },
        { status: 404 }
      );
    }

    // 2️⃣ Check if user already liked the post
    const alreadyLiked = post.likes.includes(userId);

    let updatedPost;

    if (alreadyLiked) {
      // 🔻 REMOVE LIKE
      updatedPost = await Post.findByIdAndUpdate(
        post._id,
        { $pull: { likes: userId } },
        { new: true }
      );
    } else {
      // 🔺 ADD LIKE
      updatedPost = await Post.findByIdAndUpdate(
        post._id,
        { $addToSet: { likes: userId } },
        { new: true }
      );
    }

    return NextResponse.json({
      success: true,
      liked: !alreadyLiked,
      likesCount: updatedPost.likes.length,
    });
  } catch (err) {
    console.error("LIKE API ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
