"use client";
import Form from "@/components/Form";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";

const Page = () => {
  const [post, setPost] = useState(null);
  const searchParams = useSearchParams();
  const postId = searchParams.get("postId");
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`/api/post/${postId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: post.title,
          content: post.content,
          slug: post.slug,
          image: post.image,
          tag: post.tag,
        }),
      });
      if (response.ok) {
        router.push(`/post?postId=${postId}`);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    //get the post details
    const getPost = async () => {
      try {
        const response = await fetch(`/api/post/${postId}`);
        const data = await response.json();
        setPost(data[0]);
      } catch (err) {
        console.log(err);
      }
    };
    getPost();
  }, [searchParams]);
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
