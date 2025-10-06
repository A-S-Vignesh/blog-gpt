"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Form from "./Form";

export default function EditPostClient({ slug }: { slug: string }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [post, setPost] = useState({
    title: "",
    content: "",
    slug: "",
    image: null as string | ArrayBuffer | null,
    tags: [] as string[],
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slug) return;

    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/post/${slug}`);
        const data = await res.json();

        // ✅ Check if the logged-in user is the post creator
        if (data.creator._id !== session?.user._id) {
          router.push("/unauthorized"); // or show error/toast
          return;
        }

        setPost({
          title: data.title,
          content: data.content,
          slug: data.slug,
          image: data.image,
          tags: data.tags,
        });
      } catch (err) {
        console.error("Failed to fetch post", err);
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") fetchPost();
  }, [slug, session, status]);

  if (status === "loading" || loading)
    return <p className="p-10 text-center">Loading...</p>;

  if (!post)
    return <p className="p-10 text-center">Post not found or unauthorized</p>;

  const handleUpdate = async (e: any) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/post/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(post),
      });

      if (res.ok) {
        const updated = await res.json();
        router.push(`/post/${updated.slug}`);
      } else {
        console.error("Failed to update post");
      }
    } catch (err) {
      console.error("Error updating post:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/post/${slug}`);
  };

  return (
    <Form
      name="Edit"
      post={post}
      setPost={setPost}
      handleSubmit={handleUpdate}
      submitting={submitting}
      handleCancel={handleCancel}
    />
  );
}
