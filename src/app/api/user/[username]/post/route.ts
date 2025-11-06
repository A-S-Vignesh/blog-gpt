import { connectToDatabase } from "@/lib/mongodb";
import Post from "@/models/Post";
import {User} from "@/models/User";
import { NextRequest } from "next/server";

export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) => {
  try {
    const { username } = await params;
    await connectToDatabase();

    // ✅ Find the user by username first
    const user = await User.findOne({ username }).select("_id");
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const skip = req.nextUrl.searchParams.get("skip");
    const skipValue = skip === "all" ? 0 : parseInt(skip || "0", 10);

    if (skip !== "all" && isNaN(skipValue)) {
      return new Response(JSON.stringify({ error: "Invalid skip parameter" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ✅ Fetch posts only for that user
    const query = { creator: user._id };

    const postQuery = Post.find(query)
      .select("title excerpt slug image tags date creator")
      .populate("creator", "username")
      .sort({ updatedAt: -1, date: -1 });

    if (skip !== "all") postQuery.skip(skipValue).limit(6);

    const response = await postQuery.exec();
    const postLength = await Post.countDocuments(query);

    return new Response(
      JSON.stringify({
        data: response,
        page:
          skip === "all"
            ? null
            : {
                remaining: Math.max(postLength - (skipValue + 6), 0),
                nextPage: skipValue + 6,
              },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error fetching user posts:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch user posts",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
