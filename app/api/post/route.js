import { connectToDB } from "@/db/database";
import Post from "@/db/models/post";

// get all posts
export const GET = async (req, res) => {
  try {
    await connectToDB();
    const skip = req.nextUrl.searchParams.get("skip");
    if (skip == "all") {
      const response = await Post.find({}).populate("creator");
      return new Response(JSON.stringify(response), { status: 200 });
    }

    const response = await Post.find({})
      .populate("creator")
      .sort({ date: -1 })
      .skip(parseInt(skip))
      .limit(6)
      .exec();
    const postLength = await Post.find(
      {},
      { image: 0, content: 0, slug: 0, tag: 0, date: 0 }
    );
    return new Response(
      JSON.stringify({
        data: response,
        page: {
          remaining: postLength.length - skip,
          nextPage: parseInt(skip) + 6,
        },
      }),
      { status: 200 }
    );
  } catch (error) {
    return new Response("Failed to fetch the Posts", { status: 500 });
  }
};
