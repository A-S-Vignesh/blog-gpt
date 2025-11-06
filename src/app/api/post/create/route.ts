import { connectToDatabase } from "@/lib/mongodb";
import Post from "@/models/Post";
import cloudinary from "@/lib/cloudinary";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

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

    await connectToDatabase();

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

    const plainContent = decodeEntities(content?.replace(/<[^>]+>/g, "") || "");
    const shortDescription =
      plainContent.slice(0, 150).split(" ").slice(0, -1).join(" ").trim() +
      "...";

    const newPost = new Post({
      creator: userId,
      title,
      excerpt: shortDescription,
      content,
      slug,
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
