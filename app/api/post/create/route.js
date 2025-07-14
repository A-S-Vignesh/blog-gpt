import { connectToDB } from "@/db/database";
import Post from "@/db/models/post";
import cloudinary from "@/lib/cloudinary";

export async function POST(request) {
  try {
    const { userId, title, content, slug, image, tag } = await request.json();

    if (!userId || !title || !content || !slug || !tag) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    await connectToDB();

    let imageUrl =
      "https://www.hostinger.com/tutorials/wp-content/uploads/sites/2/2021/09/how-to-write-a-blog-post.png";
    let publicId = "";

    // ✅ Upload base64 image to Cloudinary
    if (image?.startsWith("data:image")) {
      const uploaded = await cloudinary.uploader.upload(image, {
        folder: "blog-gpt/posts", // organized storage
      });
      imageUrl = uploaded.secure_url;
      publicId = uploaded.public_id;
    } else if (image) {
      // If already hosted, just use it
      imageUrl = image;
    }

    const newPost = new Post({
      creator: userId,
      title,
      content,
      slug,
      image: imageUrl,
      imagePublicId: publicId,
      tag,
    });

    await newPost.save();

    return new Response(JSON.stringify(newPost), { status: 201 });
  } catch (error) {
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
