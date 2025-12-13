import { connectToDatabase } from "@/lib/mongodb";
import Post from "@/models/Post";
import { NextResponse, NextRequest } from "next/server";
import Comment from "@/models/Comment";

import { revalidatePath } from "next/cache";
import cloudinary from "@/lib/cloudinary";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import sanitizeHtml from "sanitize-html";

type UpdatePostBody = {
  title: string;
  content: string;
  newSlug?: string;
  image: string;
  tags?: string;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string; slug: string }> }
) {
  const { username, slug } = await params;

  try {
    await connectToDatabase();

    // 1️⃣ Find the post by slug + populate creator
    const post = await Post.findOne({ slug }).populate(
      "creator",
      "name username image"
    );

    // Validate post exists AND belongs to the correct username
    if (!post || post.creator.username !== username) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // 2️⃣ Count likes
    const likesCount = post.likes?.length || 0;

    // 3️⃣ Count comments
    const commentsCount = await Comment.countDocuments({
      postId: post._id,
    });

    // 4️⃣ Fetch first-level comments
    const comments = await Comment.find({
      postId: post._id,
      parentCommentId: null,
    })
      .populate("userId", "name username image")
      .sort({ createdAt: -1 })
      .limit(20);

    return NextResponse.json(
      {
        success: true,
        ...post.toObject(),
        likesCount,
        commentsCount,
        comments,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error fetching post:", error);
    return NextResponse.json(
      { error: "Unable to fetch post" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  const { slug } = await params;

  if (!session || !session.user?._id) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { title, content, image, tags }: UpdatePostBody = await req.json();
    if (
      !title ||
      !content ||
      !slug ||
      !Array.isArray(tags) ||
      tags.length === 0
    ) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    // 2. Title too short
    if (title.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "Title is too short (min 10 characters)" }),
        { status: 400 }
      );
    }

    // 3. Content too short (SEO check)
    if (content.trim().length < 300) {
      return new Response(
        JSON.stringify({
          error: "Content is too short (minimum 300 characters required)",
        }),
        { status: 400 }
      );
    }

    // 4. Slug empty after cleaning
    if (slug.trim().length < 3) {
      return new Response(
        JSON.stringify({ error: "Slug is too short or invalid" }),
        { status: 400 }
      );
    }

    // 5. Tag length (optional)
    if (tags.some((t) => t.trim().length < 2)) {
      return new Response(
        JSON.stringify({ error: "Each tag must be at least 2 characters" }),
        { status: 400 }
      );
    }
    await connectToDatabase();
    const cleanHTML = sanitizeHtml(content, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat([
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "img",
        "pre",
        "code",
        "table",
        "thead",
        "tbody",
        "tr",
        "td",
        "th",
      ]),

      allowedAttributes: {
        "*": ["class"],
        img: ["src", "alt", "title", "width", "height"],
        a: ["href", "target", "rel"],
        code: ["class"],
      },

      allowedSchemes: ["http", "https", "mailto"],
    });

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
    post.content = cleanHTML;
    post.image = updatedImage;
    post.imagePublicId = updatedPublicId;
    post.tags = tags;

    await post.save();

    // ✅ Trigger revalidation for this specific post page
    revalidatePath(`/${session.user.username}/${post.slug}`);
    revalidatePath("/post");
    revalidatePath(`/${session.user.username}`);

    return NextResponse.json(post, { status: 200 });
  } catch (error) {
    console.error("❌ Failed to update the post:", error);
    return new Response("Failed to update the post!", { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  const { slug } = await params;

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
    revalidatePath(`/${session.user.username}/${slug}`);
    revalidatePath(`/${session.user.username}`);

    return NextResponse.json(
      { message: "Deleted Successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error deleting post:", error);
    return NextResponse.json({ error: "Error deleting post" }, { status: 500 });
  }
}
