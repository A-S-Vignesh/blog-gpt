"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { PopulatedClientPost } from "@/types/post";
import BlogPost from "@/components/BlogPost";
import InfinitySpin from "@/components/ui/InfiniteSpin";
import { getRequest } from "@/utils/requestHandler";

export default function ProfileLoadMore({
  username,
  initialCount = 6,
}: {
  username: string;
  initialCount: number;
}) {
  const skipRef = useRef(initialCount);
  const [posts, setPosts] = useState<PopulatedClientPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [noMoreData, setNoMoreData] = useState(false);

  const fetchMore = useCallback(async () => {
    if (loading || noMoreData) return;
    setLoading(true);

    try {
      const res = await getRequest(
        `/api/user/${username}/post?skip=${skipRef.current}`
      );
      const next: PopulatedClientPost[] = res?.data || [];

      if (next.length === 0) {
        setNoMoreData(true);
      } else {
        setPosts((prev) => [...prev, ...next]);
        skipRef.current += next.length;
      }
    } catch (error) {
      console.error("Profile load more error:", error);
      setNoMoreData(true);
    } finally {
      setLoading(false);
    }
  }, [username, loading, noMoreData]);

  useEffect(() => {
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } =
        document.documentElement;
      if (scrollTop + clientHeight >= scrollHeight - 80) {
        fetchMore();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [fetchMore]);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mt-4">
        {posts.map((post) => (
          <BlogPost key={post._id} post={post} />
        ))}
      </div>

      {loading && (
        <div className="w-full flex justify-center my-4">
          <InfinitySpin />
        </div>
      )}

      {noMoreData && (
        <p className="text-center text-gray-500 dark:text-gray-400 mt-4">
          No more posts ✨
        </p>
      )}
    </>
  );
}
