import { connectToDB } from "@/db/database";
import Post from "@/db/models/post";
// eslint-disable-next-line no-unused-vars
import User from "@/db/models/user";

// ✅ Get post by slug
export const GET = async (req, { params }) => {
  try {
    const slug = params.slug;
    await connectToDB();
    const post = await Post.findOne({ slug }).populate("creator");

    if (!post) {
      return new Response("Post not found", { status: 404 });
    }

    return new Response(JSON.stringify(post), { status: 200 });
  } catch (error) {
    return new Response("Unable to fetch the post", { status: 500 });
  }
};

// ✅ Update post by slug
export const PATCH = async (req, { params }) => {
  try {
    const slug = params.slug;
    const { title, content, newSlug, image, tag } = await req.json();

    await connectToDB();
    const post = await Post.findOne({ slug });

    if (!post) {
      return new Response("No post found!", { status: 404 });
    }

    post.title = title;
    post.content = content;
    post.slug = newSlug || slug; // update slug if changed
    post.image = image;
    post.tag = tag;

    await post.save();

    return new Response(JSON.stringify(post), { status: 200 });
  } catch (error) {
    return new Response("Failed to update the post!", { status: 500 });
  }
};

// ✅ Delete post by slug
export const DELETE = async (req, { params }) => {
  try {
    const slug = params.slug;
    await connectToDB();
    const deletedPost = await Post.findOneAndDelete({ slug });

    if (!deletedPost) {
      return new Response("Post not found", { status: 404 });
    }

    return new Response("Deleted Successfully!", { status: 200 });
  } catch (err) {
    return new Response("Error deleting post", { status: 500 });
  }
};
