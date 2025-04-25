import { connectToDB } from "@/db/database";
import Post from "@/db/models/post";

export const POST = async (req, res) => {
  const { userId, title, content, slug, image, tag } = await req.json();
  try {
    await connectToDB();
    const newPost = new Post({
      creator: userId,
      title,
      content,
      slug,
      image,
      tag,
    });

    await newPost.save();
    return new Response(JSON.stringify(newPost), { status: 200 });
  } catch (error) {
    return new Response("Failed to create a post!", { status: 500 });
  }
};
