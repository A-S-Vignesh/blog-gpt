"use client";

import Form from "@/components/Form";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";

const Page = () => {
  const [post, setPost] = useState({
    title: "",
    content: "",
    slug: "",
    image: "",
    tag: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");
  const router = useRouter();

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`/api/post/${slug}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(post),
      });

      if (response.ok) {
        const updated = await response.json();
        router.push(`/post/${updated.slug}`);
      } else {
        console.error("Failed to update post");
      }
    } catch (error) {
      console.error("Error updating post:", error);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const getPost = async () => {
      try {
        const response = await fetch(`/api/post/${slug}`);
        if (!response.ok) throw new Error("Failed to fetch post");

        const data = await response.json();
        setPost({
          title: data.title || "",
          content: data.content || "",
          slug: data.slug || "",
          image: data.image || "",
          tag: data.tag || "",
        });
      } catch (err) {
        console.error("Error fetching post:", err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) getPost();
  }, [slug]);

  if (loading) return <p className="p-10 text-center">Loading post...</p>;

  return (
    <Form
      name="Edit"
      post={post}
      setPost={setPost}
      handleSubmit={handleUpdate}
      submitting={submitting}
    />
  );
};

export default Page;
