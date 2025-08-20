"use client";
import Form from "@/components/Form";
// import { generatePostAction } from "@/redux/slice/generatePost";
import { clearPost } from "@/redux/features/generateSlice";
import { useAppSelector } from "@/redux/hooks";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const CreateBlog = () => {
  const { data: session } = useSession();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null as string |null);
  const generatePost = useAppSelector((state) => state.generate.post);
  const router = useRouter();
  const dispatch = useDispatch();
  const [post, setPost] = useState({
    title: "",
    content: "",
    slug: "",
    image: null as string |ArrayBuffer|null,
    tags: [] as string[],
  });

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

  const handleSubmit = async (e:any) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    

    try {
      if (!post.title || !post.content || !post.slug || !post.tags) {
        setError("Please fill in all required fields including image");
        setSubmitting(false);
        return;
      }

      const response = await fetch("/api/post/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: post.title,
          content: post.content,
          slug: post.slug,
          image: post.image,
          tags: post.tags,

        }),
      });

      const data = await response.json();

      if (response.ok) {
        try {
          router.push("/");
        } catch (err) {
          console.error("Error fetching posts:", err);
          router.push("/");
        }
      } else {
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
    dispatch(clearPost());
    router.push("/");
  };
  console.log("submited post", post);

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
