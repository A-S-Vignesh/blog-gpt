"use client";
import { ClientPost } from "@/types/post";

import { useEffect, useRef, useState, useCallback } from "react";
import BlogPost from "@/components/BlogPost";
import InfinitySpin from "./ui/InfiniteSpin";
import { getRequest } from "@/utils/requestHandler";

export default function LoadMore({ initialCount = 6 }) {
  const skipRef = useRef(initialCount); // ✅ Start from real fetched count
  const [loading, setLoading] = useState(false);
  const [noMoreData, setNoMoreData] = useState(false);
  const [morePosts, setMorePosts] = useState<ClientPost[]>([]); // ✅ Explicit type

  const fetchMore = useCallback(async () => {
    if (loading || noMoreData) return;
    setLoading(true);
    try {
      const res = await getRequest(`/api/post?skip=${skipRef.current}`);
      const next = res?.data || [];
      if (next.length === 0) {
        setNoMoreData(true);
      } else {
        setMorePosts((p) => [...p, ...next]);
        skipRef.current += next.length; // ✅ skip by actual received count
      }
    } catch (e) {
      console.error("Error loading more posts:", e);
      setNoMoreData(true);
    } finally {
      setLoading(false);
    }
  }, [loading, noMoreData]);

  useEffect(() => {
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } =
        document.documentElement;
      if (scrollTop + clientHeight >= scrollHeight - 50) {
        fetchMore();
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [fetchMore]);

  console.log("morePosts",morePosts)

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-x-10 lg:gap-x-16 mt-2 md:mt-4">
        {morePosts.map((post) => (
          <BlogPost key={post._id} post={post} />
        ))}
      </div>

      {loading && (
        <div className="w-full flex items-center justify-center mt-4">
          <InfinitySpin />
        </div>
      )}

      {noMoreData && (
        <p className="text-center text-gray-600 dark:text-gray-400 my-4">
          No more posts to load
        </p>
      )}
    </>
  );
}
