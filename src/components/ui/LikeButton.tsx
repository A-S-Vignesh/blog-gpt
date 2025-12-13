"use client";

import { useState } from "react";
import { FaHeart } from "react-icons/fa";
import { useToast } from "@/provider/ToastProvider";

export default function LikeButton({
  postSlug,
  username,
  initialLiked,
  initialCount,
}: {
  postSlug: string;
  username: string;
  initialLiked: boolean;
  initialCount: number;
}) {
  const { showToast } = useToast();

  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const toggleLike = async () => {
    if (loading) return;

    // 🔹 Save previous state (for rollback)
    const prevLiked = liked;
    const prevCount = count;

    // 🔹 Optimistic update
    setLiked(!liked);
    setCount(liked ? count - 1 : count + 1);
    setLoading(true);

    try {
      const res = await fetch(`/api/post/${username}/${postSlug}/like`, {
        method: "POST",
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to update like");
      }

      // ✅ Optional: sync with server response
      setLiked(data.liked);
      setCount(data.likesCount);
    } catch (err) {
      // ❌ Rollback UI
      setLiked(prevLiked);
      setCount(prevCount);

      showToast(
        prevLiked
          ? "Failed to remove like. Please try again."
          : "Failed to add like. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleLike}
      disabled={loading}
      className="flex items-center gap-2 transition"
    >
      <FaHeart
        className={`text-lg transition ${
          liked ? "text-red-500" : "text-gray-500"
        }`}
      />
      <span>{count}</span>
    </button>
  );
}
