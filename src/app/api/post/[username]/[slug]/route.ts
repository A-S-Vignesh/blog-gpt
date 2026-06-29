import { connectToDatabase } from "@/lib/mongodb";
import Post from "@/models/Post";
import { NextResponse, NextRequest } from "next/server";
import Comment from "@/models/Comment";

import { revalidatePath, revalidateTag } from "next/cache";
import cloudinary from "@/lib/cloudinary";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import sanitizeHtml from "sanitize-html";
import {
  POST_LIST_TAG,
  postDetailTag,
  postRelatedTag,
} from "@/lib/data/posts";
import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { rateLimit } from "@/lib/rateLimit";
import { moderateContent } from "@/lib/ai/moderation";
import { moderateImage } from "@/lib/ai/imageModeration";
import { normalizeTags, MAX_TAGS } from "@/utils/tags";
import { validatePost } from "@/lib/validation/post";
import {
  buildExcerpt,
  dataUriByteSize,
  MAX_IMAGE_BYTES,
} from "@/lib/postContent";

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

    // Validate post exists AND belongs to the correct username (case-insensitive
    // — usernames resolve regardless of URL casing).
    if (
      !post ||
      post.creator.username?.toLowerCase() !== username.toLowerCase()
    ) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Likes count is the denormalized counter on Post — kept in sync by the
    // like endpoint via `countDocuments` on the Like collection.
    const likesCount = post.likesCount ?? 0;

    // Use the denormalized counter (kept in sync by the comment create/delete
    // endpoints) instead of re-counting the whole collection on every request.
    const commentsCount = post.commentsCount ?? 0;

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
    // Throttle before any expensive work — each edit runs a Gemini moderation
    // pass and may upload to Cloudinary, both of which cost money per call.
    const rl = await rateLimit({
      key: `edit-post:${session.user._id.toString()}`,
      windowMs: 60 * 60 * 1000,
      max: 20,
    });
    if (!rl.ok) {
      return apiErrorResponse(
        new ApiError(
          "RATE_LIMITED",
          "You're editing too frequently. Please wait a bit and try again.",
          { retryAfterSeconds: rl.retryAfterSeconds },
        ),
      );
    }

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

    // Normalize tags, then validate ALL field bounds (min AND max) via the
    // shared validator — same rules as create and the client. Slug isn't
    // editable here (it's the URL param), so requireSlug is false.
    const cleanTags = normalizeTags(tags, MAX_TAGS);
    const validationError = validatePost({
      title,
      content,
      tags: cleanTags,
      requireSlug: false,
    });
    if (validationError) {
      return apiErrorResponse(
        new ApiError("VALIDATION_FAILED", validationError),
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
      return apiErrorResponse(new ApiError("NOT_FOUND", "Post not found."));
    }

    if (post.creator.toString() !== session.user._id) {
      return apiErrorResponse(
        new ApiError("FORBIDDEN", "You can only edit your own posts."),
      );
    }

    const verdict = await moderateContent(cleanHTML, { title });
    if (verdict.status === "flagged") {
      return apiErrorResponse(
        new ApiError(
          "CONTENT_FLAGGED",
          "This update was flagged by our content policy and cannot be saved. Edit the content and try again.",
          { reason: verdict.reason, categories: verdict.categories },
        ),
      );
    }

    if (post.image !== image && post.imagePublicId) {
      await cloudinary.uploader.destroy(post.imagePublicId);
    }

    let updatedImage = image;
    let updatedPublicId = post.imagePublicId;
    // True when image moderation couldn't run — allow the edit but mark the
    // post "pending" for review rather than auto-approving.
    let imageReviewPending = false;

    if (image.startsWith("data:image")) {
      // Reject oversized uploads BEFORE sending to Cloudinary (cost / DoS).
      if (dataUriByteSize(image) > MAX_IMAGE_BYTES) {
        return apiErrorResponse(
          new ApiError(
            "PAYLOAD_TOO_LARGE",
            `Image is too large (max ${Math.round(
              MAX_IMAGE_BYTES / (1024 * 1024),
            )}MB).`,
          ),
        );
      }
      // Screen the new image for disallowed content before storing it.
      const imgVerdict = await moderateImage(image);
      if (imgVerdict.status === "flagged") {
        return apiErrorResponse(
          new ApiError(
            "CONTENT_FLAGGED",
            "This image was flagged by our content policy and cannot be saved. Please choose a different image.",
            { reason: imgVerdict.reason, categories: imgVerdict.categories },
          ),
        );
      }
      if (imgVerdict.status === "error") imageReviewPending = true;

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
    post.tags = cleanTags;
    // Keep the excerpt (meta description) in sync with the edited content.
    post.excerpt = buildExcerpt(
      cleanHTML.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    );
    post.moderationStatus =
      verdict.status === "safe" && !imageReviewPending ? "approved" : "pending";
    post.moderationCheckedAt = new Date();

    await post.save();

    revalidateTag(POST_LIST_TAG, "default");
    revalidateTag(postDetailTag(post.slug), "default");
    revalidateTag(postRelatedTag(post.slug), "default");
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

    revalidateTag(POST_LIST_TAG, "default");
    revalidateTag(postDetailTag(slug), "default");
    revalidateTag(postRelatedTag(slug), "default");
    revalidatePath("/post");
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
