import { connectToDatabase } from "@/lib/mongodb";
import Post from "@/models/Post";
import { NextRequest } from "next/server";
import "@/models/User";

export const GET = async (req: NextRequest) => {
  try {
    await connectToDatabase();

    const skip = req.nextUrl.searchParams.get("skip");

    if (skip === "all") {
      const response = await Post.find({}).populate("creator");
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const skipValue = parseInt(skip || "0", 10);
    if (isNaN(skipValue)) {
      return new Response(JSON.stringify({ error: "Invalid skip parameter" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const response = await Post.find({})
      .select("title excerpt slug image tags date creator") // ✅ fetch only needed fields
      .populate("creator", "username name image") // ✅ populate only required creator fields
      .sort({ updatedAt: -1, date: -1 })
      .skip(skipValue)
      .limit(6)
      .exec();

    const postLength = await Post.countDocuments();

    return new Response(
      JSON.stringify({
        data: response,
        page: {
          remaining: Math.max(postLength - (skipValue + 6), 0),
          nextPage: skipValue + 6,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
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
