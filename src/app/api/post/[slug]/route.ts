import { connectToDatabase } from "@/lib/mongodb";
import Post from "@/models/Post";
import { NextResponse } from "next/server";

import { revalidatePath } from "next/cache"; 
import cloudinary from "@/lib/cloudinary";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

type UpdatePostBody = {
  title: string;
  content: string;
  newSlug?: string;
  image: string;
  tags?: string;
};

// ✅ Get post by slug
export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
    const { slug } = params;
    console.log("Requested slug:", slug);

  try {
    await connectToDatabase();
      const post = await Post.findOne({ slug }).populate("creator", "name username");
      console.log("Fetched post:", post);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(post, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching post:", error);
    return NextResponse.json(
      { error: "Unable to fetch the post" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { slug: string } }
): Promise<Response> {
  const session = await getServerSession(authOptions);
  const { slug } = params;

  if (!session || !session.user?._id) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { title, content, newSlug, image, tags }: UpdatePostBody =
      await req.json();
    await connectToDatabase();

    const post = await Post.findOne({ slug });

    if (!post) {
      return new Response("No post found!", { status: 404 });
    }
    
    // ✅ Check if the user is the creator
    if (post.creator.toString() !== session.user._id) {
      return NextResponse.json(
        { error: "Forbidden: Not your post" },
        { status: 403 }
      );
    }

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
    post.tags = tags;

    await post.save();

    // ✅ Trigger revalidation for this specific post page
    revalidatePath(`/post/${post.slug}`);
    revalidatePath("/post");
    revalidatePath(`/profile/${session.user.username}`);

    return NextResponse.json(post, { status: 200 });
  } catch (error) {
    console.error("❌ Failed to update the post:", error);
    return new Response("Failed to update the post!", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { slug: string } }
): Promise<Response> {
  const session = await getServerSession(authOptions);
  const { slug } = params;

  if (!session || !session.user?._id) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    await connectToDatabase();
    const post = await Post.findOne({ slug });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // ✅ Check if the user is the creator
    if (post.creator.toString() !== session.user._id) {
      return NextResponse.json(
        { error: "Forbidden: Not your post" },
        { status: 403 }
      );
    }

    // Remove image from Cloudinary before deleting
    if (post.imagePublicId) {
      await cloudinary.uploader.destroy(post.imagePublicId);
    }

    await Post.deleteOne({ slug });

    // ✅ Trigger revalidations
    revalidatePath("/posts");
    revalidatePath(`/post/${slug}`);
    revalidatePath(`/profile/${session.user.username}`);

    return NextResponse.json(
      { message: "Deleted Successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error deleting post:", error);
    return NextResponse.json(
      { error: "Error deleting post" },
      { status: 500 }
    );
  }
}
