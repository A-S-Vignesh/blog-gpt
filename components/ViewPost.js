"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Date from "@/components/Date";
import Tags from "@/components/Tags";

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
import Loading from "@/app/loading";
import { useDispatch } from "react-redux";
import { postActions } from "@/redux/slice/post";
import { getRequest } from "@/utils/requestHandlers";

const ViewPost = ({ post }) => {
  const [threedotModel, setThreedotModel] = useState(false);
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
    setShareUrl({
      ...shareUrl,
      url: document.location.href,
    });
  }, []);

  const deletePost = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/post/${post._id}`, {
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

  return (
    <section className="app center pb-4 sm:pb-8  bg-white dark:bg-dark-100">
      {!post && <Loading />}
      {loading && <Loading />}
      <div className="w-full xl:max-w-[1025px]">
        {/* tags */}
        <div className="flex justify-between  items-center">
          <div className="w-full flex flex-wrap justify-start my-4">
            <Tags tag={post?.tag} />
          </div>

          <button
            name="threedot"
            onClick={() => setThreedotModel((prev) => !prev)}
            className=" ml-4  relative threedot"
          >
            <BsThreeDotsVertical
              name="threedot"
              className="w-6 h-6 dark:text-white"
            />
            {threedotModel && (
              <ul className=" w-40  p-4 bg-slate-200 dark:bg-black border-2 dark:border-slate-800  gap-3 absolute cursor-default  flex flex-col justify-start items-center rounded-md  right-0">
                {/*show edit and delete for post owners */}
                {session?.user?.id == post?.creator._id && (
                  <>
                    <Link
                      href={`/post/edit?postId=${post?._id}`}
                      className="w-full text-black hover:text-slate-700 dark:hover:text-slate-300 dark:text-white flex justify-start gap-2  items-center font-semibold  text-left cursor-pointer"
                    >
                      <MdEdit /> Edit
                    </Link>
                    <li
                      onClick={deletePost}
                      className="w-full text-black hover:text-slate-700 dark:hover:text-slate-300 dark:text-white flex justify-start gap-2  items-center font-semibold  text-left cursor-pointer"
                    >
                      <MdDelete /> Delete
                    </li>
                  </>
                )}
                <li className="w-full text-black hover:text-slate-700 dark:hover:text-slate-300 dark:text-white flex justify-start gap-2  items-center font-semibold  text-left cursor-pointer">
                  <FaShare /> Share
                </li>

                {/* share buttons */}
                <ul className="w-full text-black hover:text-slate-700 dark:hover:text-slate-300 dark:text-white flex justify-between gap-2  items-center font-semibold  text-left cursor-pointer">
                  <li className="w-full text-black hover:text-slate-700 dark:hover:text-slate-300 dark:text-white flex justify-start gap-2  items-center font-semibold  text-left cursor-pointer">
                    <FacebookShareButton
                      title={shareUrl.title}
                      url={shareUrl.url}
                    >
                      <FacebookIcon size={32} round />
                    </FacebookShareButton>
                  </li>
                  <li className="w-full text-black hover:text-slate-700 dark:hover:text-slate-300 dark:text-white flex justify-start gap-2  items-center font-semibold  text-left cursor-pointer">
                    <WhatsappShareButton
                      url={shareUrl.url}
                      title={shareUrl.title}
                    >
                      <WhatsappIcon size={32} round />
                    </WhatsappShareButton>
                  </li>
                  <li className="w-full text-black hover:text-slate-700 dark:hover:text-slate-300 dark:text-white flex justify-start gap-2  items-center font-semibold  text-left cursor-pointer">
                    <EmailShareButton title={shareUrl.title} url={shareUrl.url}>
                      <EmailIcon size={32} round />
                    </EmailShareButton>
                  </li>
                </ul>
              </ul>
            )}
          </button>
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
        <p style={{ whiteSpace: "pre-wrap" }} className="para  mt-6 sm:mt-10">
          {" "}
          {post?.content}{" "}
        </p>
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
