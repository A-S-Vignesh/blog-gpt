import { connectToDB } from "@/db/database";
import User from "@/db/models/user";
import Post from "@/db/models/post";

export async function GET(req, { params }) {
  try {
    await connectToDB();

    // Step 1: Find the user by username
    const user = await User.findOne({ username: params.username });

    if (!user) {
      return new Response("User not found", { status: 404 });
    }

    // Step 2: Find posts by user._id
    const userPosts = await Post.find({ creator: user._id });

    if (!userPosts || userPosts.length === 0) {
      return new Response("No posts found for this user", { status: 404 });
    }

    return new Response(JSON.stringify(userPosts), { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching user posts by username:", error);
    return new Response("Failed to fetch posts", { status: 500 });
  }
}