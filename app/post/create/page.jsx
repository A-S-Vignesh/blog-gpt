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
  const [customImage, setCustomImage] = useState(null);

  useEffect(() => {
    if (generatePost) {
      setPost({
        title: generatePost.title || "",
        content: generatePost.content || "",
        slug: generatePost.slug || "",
        image: generatePost.image || "",
        tag: generatePost.tag || "",
      });
    }
  }, [generatePost]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPost((prev) => ({ ...prev, image: reader.result }));
      setCustomImage(true);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setPost((prev) => ({ ...prev, image: "" }));
    setCustomImage(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    console.log("Creating post with data:", post);

    try {
      if (
        !post.title ||
        !post.content ||
        !post.slug ||
        !post.tag 
      ) {
        setError("Please fill in all required fields including image");
        setSubmitting(false);
        return;
      }

      if (!session?.user?.id) {
        setError("User not authenticated.");
        console.error("Session ID missing:", session);
        setSubmitting(false);
        return;
      }
      console.log("Submit triggered");

      const response = await fetch("/api/post/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session.user.id,
          title: post.title,
          content: post.content,
          slug: post.slug,
          image: post.image,
          tag: post.tag,
        }),
      });

      const data = await response.json();
      console.log("Create response:", data);

      if (response.ok) {
        dispatch(generatePostAction.setPost(null));
        try {
          const postsData = await getRequest("/api/post?skip=0");
          dispatch(postActions.addPosts(postsData.data));
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
    dispatch(generatePostAction.setPost(null));
    router.push("/");
  };

  return (
    <>
      {post.image && (
        <div className="mb-4">
          <h4 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">
            Image Preview
          </h4>
          <img
            src={post.image}
            alt="Preview"
            className="w-full max-w-md rounded shadow"
          />
          <div className="mt-2 flex gap-4">
            <button onClick={handleRemoveImage} className="outline_btn">
              Remove Image
            </button>
            <label className="black_btn cursor-pointer">
              Upload Your Image
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}
      <Form
        name="Create"
        post={post}
        setPost={setPost}
        handleSubmit={handleSubmit}
        handleCancel={handleCancel}
        submitting={submitting}
        error={error}
      />
    </>
  );
};

export default Page;
