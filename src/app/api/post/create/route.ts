import { connectToDatabase } from "@/lib/mongodb";
import Post from "@/models/Post";
import cloudinary from "@/lib/cloudinary";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import sanitizeHtml from "sanitize-html";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?._id) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const userId = session.user._id.toString();
    const { title, content, slug, image, tags } = await request.json();

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
          error:
            "Content is too short (minimum 300 characters required)",
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
      "https://res.cloudinary.com/ddj4zaxln/image/upload/laptop_hyujfu.jpg";
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
      content
        ?.replace(/<[^>]+>/g, " ") // remove HTML tags
        ?.replace(/\s+/g, " ") // collapse extra spaces
        ?.trim() || "";

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
