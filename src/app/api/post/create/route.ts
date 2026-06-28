import { connectToDatabase } from "@/lib/mongodb";
import Post from "@/models/Post";
import cloudinary from "@/lib/cloudinary";
import { revalidatePath, revalidateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import sanitizeHtml from "sanitize-html";
import { rateLimit } from "@/lib/rateLimit";
import { POST_LIST_TAG } from "@/lib/data/posts";
import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { moderateContent } from "@/lib/ai/moderation";
import { moderateImage } from "@/lib/ai/imageModeration";
import { normalizeTags, MAX_TAGS } from "@/utils/tags";
import {
  buildExcerpt,
  dataUriByteSize,
  MAX_IMAGE_BYTES,
} from "@/lib/postContent";

const MAX_CONTENT_LENGTH = 20_000;

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    "h2", "h3", "h4", "h5", "h6",
    "img", "pre", "code",
    "table", "thead", "tbody", "tr", "td", "th",
  ]),
  allowedAttributes: {
    "*": ["class"],
    img: ["src", "alt", "title", "width", "height"],
    a: ["href", "target", "rel"],
    code: ["class"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  transformTags: {
    a: (_tagName, attribs) => {
      let href = attribs.href || "";
      const isMailto = /^mailto:/i.test(href);
      const isAbsolute = /^https?:\/\//i.test(href);
      const isBareDomain = /^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(href);
      if (!isMailto && !isAbsolute) {
        if (isBareDomain) {
          href = `https://${href}`;
        } else {
          return { tagName: "span", attribs: {}, text: attribs.href || "" };
        }
      }
      return {
        tagName: "a",
        attribs: {
          ...attribs,
          href,
          target: "_blank",
          rel: "nofollow noopener noreferrer",
        },
      };
    },
  },
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const decodeEntities = (str: string) =>
  str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?._id) {
      throw new ApiError("UNAUTHENTICATED", "You must be signed in to publish a post.");
    }

    const userId = session.user._id.toString();
    const body = (await request.json().catch(() => null)) as {
      title?: string;
      content?: string;
      slug?: string;
      image?: string;
      tags?: string[];
    } | null;

    if (!body) {
      throw new ApiError("BAD_REQUEST", "Request body is invalid JSON.");
    }
    const { title, content, slug, image, tags } = body;

    const rlResult = await rateLimit({
      key: `create-post:${userId}`,
      windowMs: 60 * 60 * 1000,
      max: 10,
    });
    if (!rlResult.ok) {
      throw new ApiError(
        "RATE_LIMITED",
        "You are creating posts too quickly. Please wait a while before creating another post.",
        { retryAfterSeconds: rlResult.retryAfterSeconds },
      );
    }

    if (!title || !content || !slug || !Array.isArray(tags) || tags.length === 0) {
      throw new ApiError("VALIDATION_FAILED", "Missing required fields.", {
        required: ["title", "content", "slug", "tags"],
      });
    }
    if (title.trim().length < 10) {
      throw new ApiError("VALIDATION_FAILED", "Title is too short (min 10 characters).");
    }
    if (content.trim().length < 300) {
      throw new ApiError(
        "VALIDATION_FAILED",
        "Content is too short. Posts must be at least 300 characters.",
      );
    }
    if (content.length > MAX_CONTENT_LENGTH) {
      throw new ApiError(
        "PAYLOAD_TOO_LARGE",
        `Content is too long (max ${MAX_CONTENT_LENGTH} characters). Please shorten your post.`,
      );
    }
    if (slug.trim().length < 3) {
      throw new ApiError("VALIDATION_FAILED", "Slug is too short or invalid.");
    }
    // Normalize server-side (lowercase, strip "#", dedupe, cap) — the stored
    // source of truth, regardless of what the client sent.
    const cleanTags = normalizeTags(tags, MAX_TAGS);
    if (cleanTags.length === 0) {
      throw new ApiError(
        "VALIDATION_FAILED",
        "Add at least one valid tag (2+ characters).",
      );
    }

    const cleanHTML = sanitizeHtml(content, SANITIZE_OPTIONS);
    const cleanedSlug = slugify(slug);

    await connectToDatabase();

    const existing = await Post.findOne({ creator: userId, slug: cleanedSlug }).select("_id");
    if (existing) {
      throw new ApiError("CONFLICT", "You already have a post with this slug.");
    }

    const plainContent = decodeEntities(
      cleanHTML.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    );

    // Content moderation BEFORE upload/save — saves Cloudinary cost if rejected.
    const verdict = await moderateContent(cleanHTML, { title });
    if (verdict.status === "flagged") {
      throw new ApiError(
        "CONTENT_FLAGGED",
        "This post was flagged by our content policy and cannot be published. Edit the content and try again.",
        { reason: verdict.reason, categories: verdict.categories },
      );
    }

    let imageUrl =
      "https://res.cloudinary.com/ddj4zaxln/image/upload/laptop_hyujfu.png";
    let publicId = "";
    // True when image moderation couldn't run (e.g. AI outage) — we allow the
    // upload but mark the post "pending" for review rather than auto-approve.
    let imageReviewPending = false;

    if (typeof image === "string" && image.startsWith("data:image")) {
      // Reject oversized uploads BEFORE sending to Cloudinary (cost / DoS).
      if (dataUriByteSize(image) > MAX_IMAGE_BYTES) {
        throw new ApiError(
          "PAYLOAD_TOO_LARGE",
          `Image is too large (max ${Math.round(
            MAX_IMAGE_BYTES / (1024 * 1024),
          )}MB).`,
        );
      }
      // Screen the image for disallowed content BEFORE paying to store it.
      const imgVerdict = await moderateImage(image);
      if (imgVerdict.status === "flagged") {
        throw new ApiError(
          "CONTENT_FLAGGED",
          "This image was flagged by our content policy and cannot be published. Please choose a different image.",
          { reason: imgVerdict.reason, categories: imgVerdict.categories },
        );
      }
      if (imgVerdict.status === "error") imageReviewPending = true;

      const uploaded = await cloudinary.uploader.upload(image, {
        folder: "blog-gpt/posts",
      });
      imageUrl = uploaded.secure_url;
      publicId = uploaded.public_id;
    } else if (typeof image === "string" && image) {
      imageUrl = image;
    }

    const shortDescription = buildExcerpt(plainContent);
    const wordCount = plainContent.split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.round(wordCount / 200));

    const moderationStatus =
      verdict.status === "safe" && !imageReviewPending ? "approved" : "pending";

    const newPost = new Post({
      creator: userId,
      title,
      excerpt: shortDescription,
      content: cleanHTML,
      slug: cleanedSlug,
      image: imageUrl,
      imagePublicId: publicId,
      tags: cleanTags,
      readingTime,
      date: new Date(),
      status: "published",
      moderationStatus,
      moderationCheckedAt: new Date(),
    });
    await newPost.save();

    revalidateTag(POST_LIST_TAG, "default");
    revalidatePath("/post");
    revalidatePath(`/${session.user.username}`);
    revalidatePath(`/${session.user.username}/${newPost.slug}`);

    return new Response(JSON.stringify(newPost), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || "field";
      return apiErrorResponse(
        new ApiError("CONFLICT", `A post with this ${field} already exists.`),
      );
    }
    return apiErrorResponse(error);
  }
}
