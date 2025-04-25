import Image from "next/image";
import Link from "next/link";
import React from "react";
import Tags from "./Tags";
import Date from "./Date";

const BlogPost = ({ title, _id, creator, content, tag, image, date }) => {
  return (
    <section
      className={`flex w-full sm:w-[390px] rounded-md max-h-max gap-2 mb-6  flex-col ${
        !title && "animate-pulse"
      }`}
    >
      <div className="image center  overflow-hidden rounded-md   shrink-0  h-[250px] lg:w-[390px] w-full sm:w-auto">
        <Link href={`/post?postId=${_id}`}>
          <Image
            src={image ? image : "/assets/images/laptop.jpg"}
            width={1080}
            height={520}
            alt="post-image"
            className={`${
              image ? "" : "bg-gray-200 dark:bg-gray-700 "
            } rounded-md object-cover hover:scale-110 transition ease-linear    shrink-0  h-full lg:h-[220px] lg:w-[390px] w-full sm:w-auto`}
          />
        </Link>
      </div>
      <div className="content w-full">
        {/* Date */}
        <Date date={date} creator={creator} />
        <Link
          href={`/post?postId=${_id}`}
          className={`${
            title ? " " : "skeloten_loading w-2/3 h-6"
          }  text-[24px] cursor-pointer line-clamp-1 capitalize mb-3 text-black dark:text-white font-semibold`}
        >
          {title}
        </Link>
        {content ? (
          <p style={{ fontSize: "19px" }} className="para line-clamp-3">
            {content}
          </p>
        ) : (
          <div className="my-5">
            <p className="skeloten_loading w-5/6 my-4 h-4"></p>
            <p className="skeloten_loading w-5/6 my-4 h-4"></p>
            <p className="skeloten_loading w-5/6 my-4 h-4"></p>
            <p className="skeloten_loading w-5/6 my-4 h-4"></p>
            <p className="skeloten_loading w-3/6 my-4 h-4"></p>
          </div>
        )}
        <Tags limit={4} tag={tag} />
      </div>
    </section>
  );
};

export default BlogPost;
