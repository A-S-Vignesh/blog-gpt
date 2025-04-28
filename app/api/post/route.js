import { connectToDB } from "@/db/database";
import Post from "@/db/models/post";
// eslint-disable-next-line no-unused-vars
import User from "@/db/models/user";  

// get all posts
export const GET = async (req, res) => {
  try {
    await connectToDB();
    const skip = req.nextUrl.searchParams.get("skip");
    
    if (skip === "all") {
      const response = await Post.find({}).populate("creator");
      return new Response(JSON.stringify(response), { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        }
      });
    }

    const skipValue = parseInt(skip);
    if (isNaN(skipValue)) {
      return new Response(JSON.stringify({ error: "Invalid skip parameter" }), { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        }
      });
    }

    const response = await Post.find({})
      .populate("creator")
      .sort({ date: -1 })
      .skip(skipValue)
      .limit(6)
      .exec();

    const postLength = await Post.countDocuments();
    
    return new Response(
      JSON.stringify({
        data: response,
        page: {
          remaining: postLength - skipValue,
          nextPage: skipValue + 6,
        },
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  } catch (error) {
    console.error("Error fetching posts:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch the Posts", details: error.message }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
};
