import { connectToDB } from "@/db/database";
import Post from "@/db/models/post";

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
    
    // Log the schema to see what fields are defined
    console.log("Post Schema:", Post.schema.obj);
    
    const newPost = new Post({
      creator: userId,
      title,
      content,
      post: content, // Adding both content and post fields to handle both schema possibilities
      slug,
      image: image || "https://www.hostinger.com/tutorials/wp-content/uploads/sites/2/2021/09/how-to-write-a-blog-post.png",
      tag,
    });

    console.log("Attempting to save post:", newPost);
    await newPost.save();
    console.log("Post saved successfully");
    
    return new Response(JSON.stringify(newPost), { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    console.error("Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      return new Response(
        JSON.stringify({ 
          error: "Failed to create a post", 
          details: `A post with this ${field} already exists` 
        }), 
        { status: 409 }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to create a post", 
        details: error.message,
        validationErrors: error.errors ? Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        })) : null
      }), 
      { status: 500 }
    );
  }
}
