"use client";
import Form from "@/components/Form";
import { generatePostAction } from "@/redux/slice/generatePost";
import { postActions } from "@/redux/slice/post";
import { getRequest } from "@/utils/requestHandlers";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const Page = () => {
  const { data: session } = useSession();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const generatePost = useSelector((state) => state.generatePost.post);
  const router = useRouter();
  const dispatch = useDispatch();
  const [post, setPost] = useState({
    title: "",
    content: "",
    slug: "",
    image: "",
    tag: "",
  });

  //for ai generated post
  useEffect(() => {
    if (generatePost) {
      setPost({
        ...post,
        title: generatePost.title || "",
        content: generatePost.content || "",
        slug: generatePost.slug || "",
        tag: generatePost.tag || "",
      });
    }
  }, [generatePost]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      // Validate required fields
      if (!post.title || !post.content || !post.slug || !post.tag) {
        setError("Please fill in all required fields");
        setSubmitting(false);
        return;
      }
      
      const response = await fetch("/api/post/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session?.user.id,
          title: post.title,
          content: post.content,
          slug: post.slug,
          image: post.image,
          tag: post.tag,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        dispatch(generatePostAction.setPost(null));
        try {
          const postsData = await getRequest("/api/post?skip=0");
          dispatch(postActions.addPosts(postsData.data));
          router.push("/");
        } catch (err) {
          console.error("Error fetching posts:", err);
          // Still navigate even if fetching posts fails
          router.push("/");
        }
      } else {
        // Handle error response
        setError(data.error || "Failed to create post");
        console.error("Error creating post:", data);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setError("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleCancel = () => {
    // Clear any generated post data
    dispatch(generatePostAction.setPost(null));
    // Redirect to home page
    router.push("/");
  };
  
  return (
    <Form
      name="Create"
      post={post}
      setPost={setPost}
      handleSubmit={handleSubmit}
      handleCancel={handleCancel}
      submitting={submitting}
      error={error}
    />
  );
};

export default Page;
