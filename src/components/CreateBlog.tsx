"use client";

import Form from "@/components/Form";
// import { generatePostAction } from "@/redux/slice/generatePost";
import { clearPost } from "@/redux/features/generateSlice";
import { useAppSelector } from "@/redux/hooks";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "@/provider/ToastProvider";

const CreateBlog = () => {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null as string | null);
  const generatePost = useAppSelector((state) => state.generate.post);
  const router = useRouter();
  const dispatch = useDispatch();
  const [post, setPost] = useState({
    title: "",
    content: "",
    slug: "",
    image: null as string | ArrayBuffer | null,
    tags: [] as string[],
  });
  console.log("Generate post", generatePost);

  useEffect(() => {
    if (generatePost) {
      setPost({
        title: generatePost.title || "",
        content: generatePost.content || "",
        slug: generatePost.slug || "",
        image: generatePost.image || "",
        tags: generatePost.tags || [],
      });
    }
  }, [generatePost]);

  console.log("Post content", post);


  const cleanSlug = (value: string) => {
    return value
      .toLowerCase() // lowercase
      .trim() // remove spaces front & back
      .replace(/[^a-z0-9\s-]/g, "") // remove special chars
      .replace(/\s+/g, "-") // spaces → hyphens
      .replace(/-+/g, "-"); // multiple hyphens → one
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (!post.title || !post.content || !post.slug || !post.tags) {
        showToast("Please fill in all required fields", "error");
        setSubmitting(false);
        return;
      }

      // 👉 Clean slug before sending
      const cleanedSlug = cleanSlug(post.slug);

      // If slug becomes empty after cleaning
      if (!cleanedSlug) {
        setError("Slug is invalid. Please enter a proper slug.");
        setSubmitting(false);
        return;
      }

      const response = await fetch("/api/post/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: post.title.trim(),
          content: post.content,
          slug: cleanedSlug,
          image: post.image,
          tags: post.tags,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast("Post created successfully!", "success");
        router.push("/");
      } else {
        showToast(
          data.details || data.error || "Failed to create post",
          "error"
        );
        return;
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setError("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    dispatch(clearPost());
    router.push("/");
  };

  return (
    <>
      <Form
        name="Create"
        post={post}
        setPost={setPost}
        handleSubmit={handleSubmit}
        handleCancel={handleCancel}
        submitting={submitting}
      />
    </>
  );
};

export default CreateBlog;
