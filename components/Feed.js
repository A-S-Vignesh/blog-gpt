"use clinet";

import React, { useEffect, useRef, useState } from "react";
import BlogPost from "./BlogPost";
import { useDispatch, useSelector } from "react-redux";

import { getRequest } from "@/utils/requestHandlers";
import { postActions } from "@/redux/slice/post";
import { InfinitySpin } from "react-loader-spinner";

const Feed = () => {
  const dispatch = useDispatch();
  // get from the redux store
  const posts = useSelector((state) => state.posts.posts);
  const searchResult = useSelector((state) => state.posts.searchResult);
  const displaySearchResult = useSelector(
    (state) => state.posts.displaySearchResult
  );
  const isDarkMode = useSelector((state) => state.darkMode.isDarkMode);

  const [loading, setLoading] = useState(false);
  const [noData, setNoData] = useState(false);

  const skipRef = useRef(6);

  const handleScroll = () => {
    const { clientHeight, scrollHeight, scrollTop } = document.documentElement;
    if (clientHeight + scrollTop + 2 > scrollHeight && !noData) {
      setLoading(true);
      getRequest(`/api/post?skip=${skipRef.current}`)
        .then((data) => {
          dispatch(postActions.addPosts(data.data));
          //set no post
          data.page.remaining <= 0 && setNoData(true);

          skipRef.current = data.page.nextPage;
        })
        .catch((err) => console.log(err))
        .finally(() => setLoading(false));
    }
  };
  useEffect(() => {

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <section className="w-full mt-4 min-h-screen md:my-10 sm:my-8 bg-white dark:bg-dark-100">
      <h2 className="sub_heading my-4 text-left">All blog posts</h2>
      <div className="flex flex-col sm:flex-row items-center justify-center flex-wrap gap-6 sm:gap-x-10 lg:gap-x-16 ">
        {displaySearchResult &&
          searchResult?.length !== 0 &&
          searchResult?.map((post, i) => <BlogPost key={i} {...post} />)}
        {displaySearchResult && searchResult?.length === 0 && (
          <h2 className="text-center sub_heading mt-4 w-full">
            no result found!
          </h2>
        )}
        {!displaySearchResult &&
          posts?.map((post, i) => <BlogPost key={i} {...post} />)}
      </div>
      <div className="w-full flex justify-center">
        {loading && !noData && (
          <InfinitySpin
            visible={true}
            width="200"
            color={isDarkMode ? "#fff" : "#000"}
            ariaLabel="infinity-spin-loading"
          />
        )}
      </div>
    </section>
  );
};

export default Feed;
