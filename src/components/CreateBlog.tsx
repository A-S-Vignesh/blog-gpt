"use client";

import Form from "@/components/Form";
// import { generatePostAction } from "@/redux/slice/generatePost";
import { clearPost } from "@/redux/features/generateSlice";
import {
  loadGeneratedDraft,
  clearGeneratedDraft,
} from "@/utils/generatedDraft";
import { useAppSelector } from "@/redux/hooks";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "@/provider/ToastProvider";
import { validatePost, slugify } from "@/lib/validation/post";

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
  useEffect(() => {
    // Prefer the in-memory Redux draft (set when navigating from generate).
    // Fall back to the sessionStorage copy so a refresh on this page doesn't
    // wipe the generated post.
    const source = generatePost ?? loadGeneratedDraft();
    if (source) {
      setPost({
        title: source.title || "",
        content: source.content || "",
        slug: source.slug || "",
        image: source.image || "",
        tags: source.tags || [],
      });
    }
  }, [generatePost]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Clean the slug, then validate the FINAL values with the SHARED validator
      // (identical rules to the server), so an invalid post never leaves the
      // browser and the user gets the exact reason.
      const cleanedSlug = slugify(post.slug);
      const validationError = validatePost({
        title: post.title,
        content: post.content,
        slug: cleanedSlug,
        tags: post.tags,
        requireSlug: true,
      });
      if (validationError) {
        showToast(validationError, "error");
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
        // Draft is now published — clear both the in-memory and persisted copies.
        clearGeneratedDraft();
        dispatch(clearPost());
        showToast("Post created successfully!", "success");
        router.push(`/${data.post.author}/${data.post.slug}`);
      } else {
        // Use `data.error` (the human-readable string). NOT `data.details`,
        // which is a structured object (e.g. { required: [...] }) — passing that
        // to the toast renders an object as a React child and crashes the page.
        showToast(data.error || "Failed to create post", "error");
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
    clearGeneratedDraft();
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
