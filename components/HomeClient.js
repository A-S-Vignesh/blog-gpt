// components/HomeClient.jsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { InfinitySpin } from "react-loader-spinner";
import { debounce } from "lodash";

import BlogPost from "@/components/BlogPost";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import Hero from "@/components/Hero";
import SearchInput from "@/components/SearchInput";
import useFetch from "@/hooks/useFetch";
import { getRequest } from "@/utils/requestHandlers";
import { postActions } from "@/redux/slice/post";

export default function HomeClient() {
  const [searchInput, setSearchInput] = useState("");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [noMoreData, setNoMoreData] = useState(false);
  const skipRef = useRef(1);
  const dispatch = useDispatch();

  const searchCache = useSelector((state) => state.posts.searchCache);
  const searchResult = useSelector((state) => state.posts.searchResult);
  const displaySearchResult = useSelector(
    (state) => state.posts.displaySearchResult
  );
  const posts = useSelector((state) => state.posts.posts);
  const { data, error } = useFetch("/api/post?skip=0");

  useEffect(() => {
    if (data) {
      dispatch(postActions.addPosts(data.data));
      setLoading(false);
      setTimeout(() => fetchAllPosts(), 3000);
    }
  }, [data]);

  const fetchAllPosts = async () => {
    try {
      const result = await getRequest("/api/post?skip=all");
      if (Array.isArray(result)) dispatch(postActions.addSearchCache(result));
    } catch (err) {
      console.error("Error fetching all posts", err);
    }
  };

  const handleSearch = useCallback(
    (searchTerm) => {
      if (!searchTerm.trim()) {
        dispatch(postActions.clearSearchResult());
        return;
      }
      const filtered = searchCache?.filter(
        (post) =>
          post?.creator?.username
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          post?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post?.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post?.tag.toLowerCase().includes(searchTerm.toLowerCase())
      );
      dispatch(postActions.addSearchResult(filtered));
    },
    [searchCache, dispatch]
  );

  const debouncedSearch = useCallback(
    debounce((value) => handleSearch(value), 300),
    [handleSearch]
  );

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSearch(value);
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [posts, displaySearchResult, noMoreData, isLoadingMore]);

  const handleScroll = useCallback(() => {
    if (displaySearchResult || isLoadingMore || noMoreData || loading) return;

    const { scrollTop, clientHeight, scrollHeight } = document.documentElement;
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      setIsLoadingMore(true);
      getRequest(`/api/post?skip=${skipRef.current * 6}`)
        .then((data) => {
          if (!data.data || data.data.length === 0) {
            setNoMoreData(true);
          } else {
            dispatch(postActions.addPosts([...posts, ...data.data]));
            skipRef.current += 1;
          }
        })
        .catch((err) => {
          console.error("Error loading more posts:", err);
          setNoMoreData(true);
        })
        .finally(() => setIsLoadingMore(false));
    }
  }, [posts, displaySearchResult, noMoreData, isLoadingMore]);

  return (
    <section className="app center relative bg-white dark:bg-dark-100 min-h-screen">
      <div className="transition-all duration-300 min-h-[calc(100vh-80px)] flex flex-col">
        <Hero />
        <SearchInput value={searchInput} onChange={handleInputChange} />
        <hr className="hr" />

        <div className="flex flex-col sm:flex-row items-center justify-center flex-wrap gap-6 sm:gap-x-10 lg:gap-x-16">
          {loading ? (
            <div className="w-full flex items-center justify-center mt-2 md:mt-4">
              <LoadingSkeleton count={6} />
            </div>
          ) : (
              <div className="w-full flex items-center justify-center mt-2 md:mt-4">
                <div className="w-full flex flex-col sm:flex-row items-center justify-center flex-wrap gap-6 sm:gap-x-10 lg:gap-x-16">
                {displaySearchResult &&
                  searchResult?.length > 0 &&
                  searchResult.map((post, i) => <BlogPost key={i} {...post} />)}
                {displaySearchResult && searchResult?.length === 0 && (
                  <h2 className="text-center sub_heading mt-4 w-full">
                    No results found!
                  </h2>
                )}
                {!displaySearchResult &&
                    posts?.map((post, i) => <BlogPost key={i} {...post} />)}
                  </div>
              </div>
          )}
        </div>

        {isLoadingMore && (
          <div className="w-full flex items-center justify-center mt-4">
            <InfinitySpin width="150" color="#4F46E5" />
          </div>
        )}
        {noMoreData && (
          <p className="text-center text-gray-600 dark:text-gray-400 my-4">
            No more posts to load
          </p>
        )}
        {error && (
          <div className="text-red-500 text-center my-4">
            Failed to load posts. Please try again.
          </div>
        )}
      </div>
      <SpeedInsights />
    </section>
  );
}
