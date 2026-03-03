import { connectToDatabase } from "@/lib/mongodb";
import Post from "@/models/Post";
import cloudinary from "@/lib/cloudinary";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import sanitizeHtml from "sanitize-html";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?._id) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const userId = session.user._id.toString();
    const { title, content, slug, image, tags } = await request.json();

    const rlResult = rateLimit({
      key: `create-post:${userId}`,
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10, // up to 10 new posts per hour per user
    });

    if (!rlResult.ok) {
      return new Response(
        JSON.stringify({
          error:
            "You are creating posts too quickly. Please wait a while before creating another post.",
          code: "RATE_LIMITED",
          retryAfterSeconds: rlResult.retryAfterSeconds,
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    if (
      !title ||
      !content ||
      !slug ||
      !Array.isArray(tags) ||
      tags.length === 0
    ) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          code: "BAD_REQUEST",
        }),
        { status: 400 }
      );
    }

    // 2. Title too short
    if (title.trim().length < 10) {
      return new Response(
        JSON.stringify({
          error: "Title is too short (min 10 characters)",
          code: "TITLE_TOO_SHORT",
        }),
        { status: 400 }
      );
    }

    // 3. Content too short (SEO check)
    if (content.trim().length < 300) {
      return new Response(
        JSON.stringify({
          error: "Content is too short (minimum 300 characters required)",
          code: "CONTENT_TOO_SHORT",
        }),
        { status: 400 }
      );
    }

    // 3b. Content too long (safety upper bound to avoid abuse)
    const MAX_CONTENT_LENGTH = 20000;
    if (content.length > MAX_CONTENT_LENGTH) {
      return new Response(
        JSON.stringify({
          error: `Content is too long (max ${MAX_CONTENT_LENGTH} characters). Please shorten your post.`,
          code: "CONTENT_TOO_LONG",
        }),
        { status: 400 }
      );
    }

    // 4. Slug empty after cleaning
    if (slug.trim().length < 3) {
      return new Response(
        JSON.stringify({
          error: "Slug is too short or invalid",
          code: "SLUG_INVALID",
        }),
        { status: 400 }
      );
    }

    // 5. Tag length (optional)
    if (tags.some((t) => t.trim().length < 2)) {
      return new Response(
        JSON.stringify({
          error: "Each tag must be at least 2 characters",
          code: "TAG_TOO_SHORT",
        }),
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

      transformTags: {
        a: (tagName, attribs) => {
          let href = attribs.href || "";

          const isMailto = /^mailto:/i.test(href);
          const isAbsolute = /^https?:\/\//i.test(href);
          const isBareDomain = /^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(href); // e.g., codolve.com or codolve.com/page

          if (!isMailto && !isAbsolute) {
            if (isBareDomain) {
              // Prepend https:// to bare domains
              href = `https://${href}`;
            } else {
              // Strip internal/relative links
              return {
                tagName: "span",
                attribs: {},
                text: attribs.href || "",
              };
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
    });

    const slugify = (value: String) => {
      return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
    };

    const cleanedSlug = slugify(slug);

    const post = await Post.findOne({ slug: cleanedSlug });

    if (post) {
      return new Response(
        JSON.stringify({
          error: "Failed to create a post",
          details: "A post with this slug already exists",
        }),
        { status: 409 }
      );
    }

    let imageUrl =
      "https://res.cloudinary.com/ddj4zaxln/image/upload/laptop_hyujfu.png";
    let publicId = "";

    if (typeof image === "string" && image.startsWith("data:image")) {
      const uploaded = await cloudinary.uploader.upload(image, {
        folder: "blog-gpt/posts",
      });
      imageUrl = uploaded.secure_url;
      publicId = uploaded.public_id;
    } else if (typeof image === "string" && image) {
      // already hosted URL
      imageUrl = image;
    }

    const decodeEntities = (str: string) =>
      str
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, " ");

    const textOnly =
      cleanHTML
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim() || "";

    const plainContent = decodeEntities(textOnly);
    const shortDescription =
      plainContent.slice(0, 150).split(" ").slice(0, -1).join(" ").trim() +
      "...";

    const newPost = new Post({
      creator: userId,
      title,
      excerpt: shortDescription,
      content: cleanHTML,
      slug: cleanedSlug,
      image: imageUrl,
      imagePublicId: publicId,
      tags,
      date: new Date(),
    });

    await newPost.save();
    revalidatePath(`/post/${newPost.slug}`);
    revalidatePath("/post");
    revalidatePath(`/profile/${session.user.username}`);

    return new Response(JSON.stringify(newPost), { status: 201 });
  } catch (error: any) {
    console.error("Error creating post:", error);

    // Duplicate key (e.g., slug or title)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return new Response(
        JSON.stringify({
          error: "Failed to create a post",
          details: `A post with this ${field} already exists`,
        }),
        { status: 409 }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Failed to create a post",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}
