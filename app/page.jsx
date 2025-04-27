"use client";

import Feed from "@/components/Feed";
import { darkModeActions } from "@/redux/slice/DarkMode";
import { postActions } from "@/redux/slice/post";
import { useEffect, useState, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import BlogPost from "@/components/BlogPost";
import { InfinitySpin } from "react-loader-spinner";

import Loading from "./loading";
import useFetch from "@/hooks/useFetch";
import { getRequest } from "@/utils/requestHandlers";
import { debounce } from "lodash";
import LoadingSkeleton from "@/components/LoadingSkeleton";

export default function Home() {
  const [searchInput, setSearchInput] = useState("");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [noMoreData, setNoMoreData] = useState(false);
  const [showInitialLoader, setShowInitialLoader] = useState(true);
  const skipRef = useRef(1);
  const dispatch = useDispatch();

  const searchCache = useSelector((state) => state.posts.searchCache);
  const searchResult = useSelector((state) => state.posts.searchResult);
  const displaySearchResult = useSelector((state) => state.posts.displaySearchResult);
  const posts = useSelector((state) => state.posts.posts);
  const { data, loading, error } = useFetch("/api/post?skip=0");

  //for dark theme
  useEffect(() => {
    //check for device default theme dark or light
    //if it is dark set theme dark
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      dispatch(darkModeActions.toggleDarkMode(true));
    }
  }, []);

  // Handle initial loading animation
  useEffect(() => {
    if (data) {
      // Brief delay before hiding the loader
      const timer = setTimeout(() => {
        setShowInitialLoader(false);
      }, 800); // Short 800ms delay
      return () => clearTimeout(timer);
    }
  }, [data]);

  //initial post fetch
  useEffect(() => {
    data && dispatch(postActions.addPosts(data.data));
    const searchTimer = setTimeout(() => {
      if (data) {
        fetchAllPosts();
      }
    }, 3000);
    return () => clearTimeout(searchTimer);
  }, [data]);

  const fetchAllPosts = async () => {
    try {
      const data = await getRequest("/api/post?skip=all");
      if (data && Array.isArray(data)) {
        dispatch(postActions.addSearchCache(data));
      } else {
        console.error("Invalid data format received from server");
      }
    } catch (error) {
      console.error("Error fetching all posts:", error);
    }
  };

  // Create a memoized version of the search handler
  const handleSearch = useCallback((searchTerm) => {
    if (searchTerm.trim().length === 0) {
      dispatch(postActions.clearSearchResult());
      return;
    }
    const filterPost = searchCache?.filter(
      (post) =>
        post?.creator?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post?.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post?.tag.toLowerCase().includes(searchTerm.toLowerCase())
    );
    dispatch(postActions.addSearchResult(filterPost));
  }, [searchCache, dispatch]);

  // Create a debounced version of the search handler
  const debouncedSearch = useCallback(
    debounce((value) => handleSearch(value), 300),
    [handleSearch]
  );

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSearch(value);
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
          setNoMoreData(true); // Prevent infinite retries on error
        })
        .finally(() => setIsLoadingMore(false));
    }
  }, [posts, displaySearchResult, noMoreData, isLoadingMore, loading]);

  return (
    <section className="app center relative bg-white dark:bg-dark-100 min-h-screen">
      {/* Initial loading overlay */}
      {(loading && showInitialLoader) && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <InfinitySpin width="200" color="#4F46E5" />
        </div>
      )}

      <div className={`${(loading && showInitialLoader) ? 'blur-sm' : ''} transition-all duration-300 min-h-[calc(100vh-80px)] flex flex-col`}>
        <h1 className="text-5xl sm:text-7xl primary text-center md:text-9xl mt-6 uppercase font-bold text-black dark:text-white">
          The blog GPT
        </h1>
        <p className="my-2 mb-3 capitalize text-black dark:text-white text-center text-sm sm:text-md font-medium">
          We smash you with the information that will make your life easier
          Really.
        </p>

        <div className="w-full flex justify-center items-center mt-2 mb-8">
          <input
            type="text"
            name="search"
            value={searchInput}
            onChange={handleInputChange}
            placeholder="Search for a Blogs..."
            className="text-sm font-medium focus:ring-0 border-black dark:border-white dark:text-white 
            border bg-transparent shadow-lg max-w-[90%]
            rounded-md sm:w-96 focus:outline-none focus:border-black pl-4 pr-12 py-2 sm:py-3"
            id=""
          />
        </div>
        <hr className="hr" />

        <div className="flex-grow flex flex-col sm:flex-row items-center justify-center flex-wrap gap-6 sm:gap-x-10 lg:gap-x-16 min-h-[400px] w-full">
          {loading && showInitialLoader ? (
            <LoadingSkeleton count={6} />
          ) : (
            <>
              {displaySearchResult && searchResult?.length > 0 && (
                searchResult.map((post, i) => <BlogPost key={i} {...post} />)
              )}
              {displaySearchResult && searchResult?.length === 0 && (
                <h2 className="text-center sub_heading mt-4 w-full">
                  No results found!
                </h2>
              )}
              {!displaySearchResult && posts?.map((post, i) => <BlogPost key={i} {...post} />)}
            </>
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
    </section>
  );
}
