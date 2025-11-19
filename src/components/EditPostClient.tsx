"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Form from "./Form";

export default function EditPostClient({ slug }: { slug: string }) {
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

    fetchPost();
  }, [slug]);

  if (loading)
    return <FormSkeleton />;

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

function FormSkeleton() {
  return (
    <>
      <section className="py-16 px-6 sm:px-16 md:px-20 lg:px-28 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Refine Your{" "}
            <span className="text-blue-600 dark:text-blue-400">Creation</span>
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
            Perfect your post and make it shine.
          </p>
        </div>
      </section>
      <div className="animate-pulse space-y-8 w-full max-w-7xl 2xl:max-w-[85%] mx-auto px-2 md:px-4 py-8">
        {/* Title Skeleton */}
        <div className="bg-white dark:bg-dark-100 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-blue-200 dark:bg-blue-800 rounded-lg mr-3" />
            <div className="w-40 h-6 bg-gray-300 dark:bg-gray-700 rounded" />
          </div>
          <div className="w-full h-12 bg-gray-200 dark:bg-gray-800 rounded-lg" />
        </div>

        {/* Content Skeleton */}
        <div className="bg-white dark:bg-dark-100 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-purple-200 dark:bg-purple-800 rounded-lg mr-3" />
            <div className="w-40 h-6 bg-gray-300 dark:bg-gray-700 rounded" />
          </div>
          <div className="w-full h-64 bg-gray-200 dark:bg-gray-800 rounded-lg" />
        </div>

        {/* Image Upload Skeleton */}
        <div className="bg-white dark:bg-dark-100 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-amber-200 dark:bg-amber-800 rounded-lg mr-3" />
            <div className="w-40 h-6 bg-gray-300 dark:bg-gray-700 rounded" />
          </div>
          <div className="w-full h-48 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        </div>

        {/* Tags Skeleton */}
        <div className="bg-white dark:bg-dark-100 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-indigo-200 dark:bg-indigo-800 rounded-lg mr-3" />
            <div className="w-40 h-6 bg-gray-300 dark:bg-gray-700 rounded" />
          </div>

          <div className="flex gap-2 mb-4">
            <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
          </div>

          <div className="w-full h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>

        {/* Buttons Skeleton */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 h-12 bg-gray-300 dark:bg-gray-700 rounded-xl" />
          <div className="flex-1 h-12 bg-blue-300 dark:bg-blue-700 rounded-xl" />
        </div>
      </div>
    </>
  );
}
