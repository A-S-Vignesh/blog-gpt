"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Date from "@/components/Date";
import Tags from "@/components/Tags";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";

import { BsThreeDotsVertical } from "react-icons/bs";
import { useSession } from "next-auth/react";
import { MdDelete, MdEdit } from "react-icons/md";
import { FaShare } from "react-icons/fa";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getRequest } from "@/utils/requestHandler";


import {
  EmailIcon,
  EmailShareButton,
  FacebookIcon,
  FacebookShareButton,
  WhatsappIcon,
  WhatsappShareButton,
} from "react-share";
import { useDispatch } from "react-redux";
import { ClientPost } from "@/types/post";
// import { postActions } from "@/redux/slice/post";
// import { getRequest } from "@/utils/requestHandlers";

interface ViewPostProps{
    post: ClientPost;
}

interface ShareData {
  title: string;
  url: string;
}

const ViewPost:React.FC<ViewPostProps> = ({ post }
) => {
  const [threedotModel, setThreedotModel] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
 const [shareUrl, setShareUrl] = useState<ShareData>({
   title: "Check out this interesting post!",
   url: "",
 });
  //get the login user data
  const { data: session } = useSession();
  const router = useRouter();
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setThreedotModel(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


   useEffect(() => {
     setShareUrl((prev) => ({
       ...prev,
       url: window.location.href, // ✅ safe in client components
     }));
   }, []);


  const deletePost = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/post/${post.slug}`, {
        method: "DELETE",
      });
      if (response.ok) {
        router.push("/post")
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <section className="app center pb-4 sm:pb-8  bg-white dark:bg-dark-100">
      <div className="w-full xl:max-w-[1025px]">
        {/* tags */}
        <div className="flex justify-between  items-center">
          <div className="w-full flex flex-wrap justify-start my-4">
            <Tags tags={post?.tags} />
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              name="threedot"
              onClick={() => setThreedotModel((prev) => !prev)}
              className="ml-4 threedot"
            >
              <BsThreeDotsVertical className="w-6 h-6 dark:text-white hover:cursor-pointer" />
            </button>

            {threedotModel && (
              <ul className="absolute right-0 w-40 p-4 bg-slate-200 dark:bg-black border-2 dark:border-slate-800 flex flex-col gap-3 rounded-md z-10">
                {/* Owner actions */}
                {session?.user?._id ===
                  (typeof post?.creator === "string"
                    ? post.creator
                    : post?.creator._id) && (
                  <>
                    <Link
                      href={`/post/${post?.slug}/edit`}
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
                      //   toast.success("Link copied to clipboard!");
                    }}
                    className="w-full flex items-center gap-2 text-left font-semibold text-black hover:text-slate-700 dark:text-white dark:hover:text-slate-300 hover:cursor-pointer"
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
            src={
              post?.image ??
              "https://res.cloudinary.com/ddj4zaxln/image/upload/laptop_hyujfu.jpg"
            }
          />
        </div>
        {/* paragraph */}
        <div className="para para-page mt-6 sm:mt-10 prose dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              a: ({ href, children, ...props }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  {...props}
                >
                  {children}
                </a>
              ),
            }}
          >
            {post?.content}
          </ReactMarkdown>

          {/* {post?.content} */}
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
