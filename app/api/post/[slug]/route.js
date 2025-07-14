import { connectToDB } from "@/db/database";
import Post from "@/db/models/post";
import cloudinary from "@/lib/cloudinary";
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

    if (!post) return new Response("No post found!", { status: 404 });

    // 👇 Only delete the old image if it's changed
    if (post.image !== image && post.imagePublicId) {
      await cloudinary.uploader.destroy(post.imagePublicId);
    }

    // Optional: upload new image if it's base64
    let updatedImage = image;
    let updatedPublicId = post.imagePublicId;

    if (image.startsWith("data:image")) {
      const uploaded = await cloudinary.uploader.upload(image, {
        folder: "blog-gpt/posts",
      });
      updatedImage = uploaded.secure_url;
      updatedPublicId = uploaded.public_id;
    }

    post.title = title;
    post.content = content;
    post.slug = newSlug || slug;
    post.image = updatedImage;
    post.imagePublicId = updatedPublicId;
    post.tag = tag;

    await post.save();

    return new Response(JSON.stringify(post), { status: 200 });
  } catch (error) {
    return new Response("Failed to update the post!", { status: 500 });
  }
};

export const DELETE = async (req, { params }) => {
  try {
    const slug = params.slug;
    await connectToDB();
    const post = await Post.findOneAndDelete({ slug });

    if (!post) return new Response("Post not found", { status: 404 });

    // Delete image from Cloudinary
    if (post.imagePublicId) {
      await cloudinary.uploader.destroy(post.imagePublicId);
    }

    return new Response("Deleted Successfully!", { status: 200 });
  } catch (err) {
    return new Response("Error deleting post", { status: 500 });
  }
};



