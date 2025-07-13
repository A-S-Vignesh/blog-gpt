"use client";

import React, { useEffect,useRef, useState } from "react";
import Image from "next/image";
import Date from "@/components/Date";
import Tags from "@/components/Tags";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";

import { BsThreeDotsVertical } from "react-icons/bs";
import { useSession } from "next-auth/react";
import { MdDelete, MdEdit } from "react-icons/md";
import { FaShare } from "react-icons/fa";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  EmailIcon,
  EmailShareButton,
  FacebookIcon,
  FacebookShareButton,
  WhatsappIcon,
  WhatsappShareButton,
} from "react-share";
import { useDispatch } from "react-redux";
import { postActions } from "@/redux/slice/post";
import { getRequest } from "@/utils/requestHandlers";

const ViewPost = ({ post }) => {
  const [threedotModel, setThreedotModel] = useState(false);
  const dropdownRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const [shareUrl, setShareUrl] = useState({
    title: "Check out this interesting post! ",
    url: null,
  });
  //get the login user data
  const { data: session } = useSession();
  const router = useRouter();
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setThreedotModel(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  useEffect(() => {
    setShareUrl({
      ...shareUrl,
      url: document.location.href,
    });
  }, []);

  const deletePost = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/post/${post.slug}`, {
        method: "DELETE",
      });
      if (response.ok) {
        // fetch the updated posts
        getRequest("/api/post?skip=0")
          .then((data) => {
            dispatch(postActions.addPosts(data.data));
            setLoading(false);
            router.push("/");
          })
          .catch((err) => console.log(err))
          .finally(() => setLoading(false));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const ViewPostSkeleton = () => (
    <section className="app center pb-4 sm:pb-8 bg-white dark:bg-dark-100 animate-pulse">
      <div className="w-full xl:max-w-[1025px] space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex gap-2 flex-wrap">
            <div className="w-20 h-6 bg-gray-300 dark:bg-slate-700 rounded" />
            <div className="w-16 h-6 bg-gray-300 dark:bg-slate-700 rounded" />
          </div>
          <div className="w-6 h-6 bg-gray-300 dark:bg-slate-700 rounded-full" />
        </div>

        <div className="h-10 w-3/4 bg-gray-300 dark:bg-slate-700 rounded" />
        <div className="h-6 w-1/2 bg-gray-300 dark:bg-slate-700 rounded" />

        <div className="w-full sm:w-[400px] lg:h-[400px] lg:max-w-[80%] h-[200px] bg-gray-300 dark:bg-slate-700 rounded-md mx-auto" />

        <div className="space-y-3">
          <div className="h-4 bg-gray-300 dark:bg-slate-700 rounded w-full" />
          <div className="h-4 bg-gray-300 dark:bg-slate-700 rounded w-5/6" />
          <div className="h-4 bg-gray-300 dark:bg-slate-700 rounded w-3/4" />
          <div className="h-4 bg-gray-300 dark:bg-slate-700 rounded w-full" />
          <div className="h-4 bg-gray-300 dark:bg-slate-700 rounded w-2/3" />
        </div>

        <div className="w-48 h-8 bg-gray-300 dark:bg-slate-700 rounded mx-auto" />
      </div>
    </section>
  );

  if (!post || loading) {
    return <ViewPostSkeleton />;
  }


  return (
    <section className="app center pb-4 sm:pb-8  bg-white dark:bg-dark-100">
      <div className="w-full xl:max-w-[1025px]">
        {/* tags */}
        <div className="flex justify-between  items-center">
          <div className="w-full flex flex-wrap justify-start my-4">
            <Tags tag={post?.tag} />
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              name="threedot"
              onClick={() => setThreedotModel((prev) => !prev)}
              className="ml-4 threedot"
            >
              <BsThreeDotsVertical className="w-6 h-6 dark:text-white" />
            </button>

            {threedotModel && (
              <ul className="absolute right-0 w-40 p-4 bg-slate-200 dark:bg-black border-2 dark:border-slate-800 flex flex-col gap-3 rounded-md z-10">
                {/* Owner actions */}
                {session?.user?.id === post?.creator._id && (
                  <>
                    <Link
                      href={`/post/edit?slug=${post?.slug}`}
                      className="w-full flex items-center gap-2 text-left font-semibold text-black hover:text-slate-700 dark:text-white dark:hover:text-slate-300"
                    >
                      <MdEdit /> Edit
                    </Link>
                    <li
                      onClick={deletePost}
                      className="w-full flex items-center gap-2 text-left font-semibold text-black hover:text-slate-700 dark:text-white dark:hover:text-slate-300 cursor-pointer"
                    >
                      <MdDelete /> Delete
                    </li>
                  </>
                )}

                <li>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Link copied to clipboard!");
                    }}
                    className="w-full flex items-center gap-2 text-left font-semibold text-black hover:text-slate-700 dark:text-white dark:hover:text-slate-300"
                  >
                    <FaShare /> Share
                  </button>
                </li>

                <div className="flex justify-between gap-2">
                  <FacebookShareButton
                    title={shareUrl.title}
                    url={shareUrl.url}
                  >
                    <FacebookIcon size={32} round />
                  </FacebookShareButton>
                  <WhatsappShareButton
                    title={shareUrl.title}
                    url={shareUrl.url}
                  >
                    <WhatsappIcon size={32} round />
                  </WhatsappShareButton>
                  <EmailShareButton title={shareUrl.title} url={shareUrl.url}>
                    <EmailIcon size={32} round />
                  </EmailShareButton>
                </div>
              </ul>
            )}
          </div>
        </div>

        {/* title */}

        <h2 className="font-bold capitalize text-[#181A2A] dark:text-white text-3xl sm:text-4xl mb-4 w-full text-left">
          {post?.title}
        </h2>

        {/* Date */}
        <div className="text-left w-full">
          <Date date={post?.date} creator={post?.creator} />
        </div>
        {/* image */}
        <div className="w-full center  m-auto rounded-md overflow-hidden sm:w-[400px] sm:h-auto  lg:h-[400px]  lg:max-w-[80%] h-auto">
          <Image
            alt="post image"
            width={100}
            height={100}
            className={`${
              !post?.image && "skeloten_loading"
            }  w-full h-full object-contain rounded-md object-center`}
            src={post?.image}
          />
        </div>
        {/* paragraph */}
        <div className="para mt-6 sm:mt-10 prose dark:prose-invert max-w-none">
          {post?.content.includes("*") || post?.content.includes("#") ? (
            <ReactMarkdown>{post?.content}</ReactMarkdown>
          ) : (
            <div style={{ whiteSpace: "pre-wrap" }}>{post?.content}</div>
          )}
        </div>
        {/* slogan */}
        {post?.slug && (
          <div className="bg-[#F6F6F7] dark:bg-[#242535] mt-8 dark:text-white border-l-4 text-black p-4 rounded-lg text-center capitalize text-lg font-semibold">
            {post?.slug}
          </div>
        )}
      </div>
    </section>
  );
};

export default ViewPost;
