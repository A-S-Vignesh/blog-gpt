import { connectToDB } from "@/db/database";
import Post from "@/db/models/post";
import User from "@/db/models/user";
import cloudinary from "@/lib/cloudinary";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

// ✅ Get post by slug
export const GET = async (req, props) => {
  const { slug } = await props.params;
  try {
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

// ✅ Update post by slug (only by creator)
export const PATCH = async (req, props) => {
  const session = await getServerSession(authOptions);
  const { slug } = await props.params;

  if (!session || !session.user?._id) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { title, content, newSlug, image, tag } = await req.json();
    await connectToDB();

    const post = await Post.findOne({ slug });

    if (!post) return new Response("No post found!", { status: 404 });

    // ✅ Check if the logged-in user is the creator
    // if (post.creator.toString() !== session.user._id) {
    //   return new Response("Forbidden: Not your post", { status: 403 });
    // }

    // 👇 If image changed, delete old one
    if (post.image !== image && post.imagePublicId) {
      await cloudinary.uploader.destroy(post.imagePublicId);
    }

    // ✅ Upload new image if it's base64
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

// ✅ Delete post by slug (only by creator)
export const DELETE = async (req, props) => {
  const session = await getServerSession(authOptions);
  const { slug } = await props.params;

  if (!session || !session.user?._id) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    await connectToDB();
    const post = await Post.findOne({ slug });

    if (!post) return new Response("Post not found", { status: 404 });

    // ✅ Check if the user is the creator
    if (post.creator.toString() !== session.user._id) {
      return new Response("Forbidden: Not your post", { status: 403 });
    }

    await Post.deleteOne({ slug });

    // Remove image from Cloudinary
    if (post.imagePublicId) {
      await cloudinary.uploader.destroy(post.imagePublicId);
    }

    return new Response("Deleted Successfully!", { status: 200 });
  } catch (err) {
    return new Response("Error deleting post", { status: 500 });
  }
};
