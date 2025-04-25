import { connectToDB } from "@/db/database";
import Post from "@/db/models/post";

// to get specific post

export const GET = async (req, { params }) => {
  //params for router param ( postId)
  try {
    const postId = params.postId;
    await connectToDB();
    const response = await Post.find({ _id: postId }).populate("creator");
    return new Response(JSON.stringify(response), { status: 200 });
  } catch (error) {
    return new Response(`Unable to fetch the post `, { status: 501 });
  }
};

// update the specific post
export const PATCH = async (req, { params }) => {
  try {
    const postId = params.postId;
    const { title, content, slug, image, tag } = await req.json();
    await connectToDB();
    const existingPost = await Post.findById(postId);
    if (!existingPost) return new Response("No post found!", { status: 404 });
    existingPost.title = title;
    existingPost.content = content;
    existingPost.slug = slug;
    existingPost.image = image;
    existingPost.tag = tag;
    await existingPost.save();
    return new Response(JSON.stringify(existingPost), { status: 200 });
  } catch (error) {
    new Response("Failed to update the post!", { status: 501 });
  }
};

export const DELETE = async (req, { params }) => {
  try {
    const postId = params.postId;
    await connectToDB();
    await Post.findByIdAndDelete(postId);
    return new Response("Deleted Successfully!", { status: 200 });
  } catch (err) {
    return new Response(err, { status: 500 });
  }
};
