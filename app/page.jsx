"use client";

import Feed from "@/components/Feed";
import { darkModeActions } from "@/redux/slice/DarkMode";
import { postActions } from "@/redux/slice/post";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import Loading from "./loading";
import useFetch from "@/hooks/useFetch";
import { getRequest } from "@/utils/requestHandlers";

export default function Home() {
  const [searchInput, setSearchInput] = useState("");
  const dispatch = useDispatch();

  const searchCache = useSelector((state) => state.posts.searchCache);
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
      getRequest("/api/post?skip=all")
        .then((data) => dispatch(postActions.addSearchCache(data)))
        .catch((err) => console.log(err));
    } catch (error) {
      console.log(error);
    }
  };

  //debouncing search
  useEffect(() => {
    const handleSeachPosts = () => {
      // initial search post fetch

      if (searchInput.trim().length === 0) {
        return dispatch(postActions.clearSearchResult());
      }
      const filterPost = searchCache?.filter(
        (post) =>
          post?.creator?.username
            .toLowerCase()
            .includes(searchInput.toLowerCase()) ||
          post?.title.toLowerCase().includes(searchInput.toLowerCase()) ||
          post?.content.toLowerCase().includes(searchInput.toLowerCase()) ||
          post?.tag.toLowerCase().includes(searchInput.toLowerCase())
      );
      dispatch(postActions.addSearchResult(filterPost));
    };

    handleSeachPosts();
  }, [searchInput]);

  return (
    <section className="app center relative bg-white dark:bg-dark-100">
      <h1 className="text-5xl sm:text-7xl primary text-center md:text-9xl mt-6 uppercase font-bold text-black dark:text-white">
        The blog GPT
      </h1>
      <p className="my-2 mb-3 capitalize text-black dark:text-white text-center text-sm sm:text-md font-medium">
        We smash you with the information that will make your life easier
        Really.
      </p>

      <div className="relative center w-fit mt-2 h-auto mb-8 ">
        <input
          type="text"
          name="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search for a Blogs..."
          className=" text-sm   font-medium focus:ring-0  border-black dark:border-white dark:text-white  
        border bg-transparent shadow-lg 
        rounded-md sm:w-96 focus:outline-none  focus:border-black pl-4 pr-12 py-2 sm:py-3"
          id=""
        />
      </div>
      <hr className="hr" />
      {/* background animation style */}

      {loading && <Loading />}
      <Feed />
    </section>
  );
}
