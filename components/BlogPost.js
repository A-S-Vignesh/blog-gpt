import Image from "next/image";
import Link from "next/link";
import React from "react";
import Tags from "./Tags";
import Date from "./Date";
import ReactMarkdown from "react-markdown";

const BlogPost = ({ title, slug, creator, content, tag, image, date }) => {
  return (
    <div className="flex w-full max-w-full sm:max-w-[390px] rounded-md gap-2 mb-6 flex-col mt-2 md:mt-4">
      <div className="relative w-full h-[250px] overflow-hidden rounded-md">
        <Link href={`/post/${slug}`} className="block w-full h-full">
          <Image
            src={image ? image : "/assets/images/laptop.jpg"}
            alt="post-image"
            fill
            className={`${
              image ? "" : "bg-gray-200 dark:bg-gray-700"
            } rounded-md object-cover hover:scale-110 transition ease-linear duration-200`}
            sizes="(max-width: 768px) 100vw, 390px"
            priority
          />
        </Link>
      </div>

      <div className="content w-full">
        <Date date={date} creator={creator} />

        <Link
          href={`/post/${slug}`}
          className="text-[20px] sm:text-[24px] cursor-pointer line-clamp-1 capitalize mb-3 text-black dark:text-white font-semibold"
        >
          {title}
        </Link>

        {content && (
          <div className="para line-clamp-3 text-md">
            {content.includes("*") || content.includes("#") ? (
              <ReactMarkdown>{content}</ReactMarkdown>
            ) : (
              <div style={{ whiteSpace: "pre-wrap" }} className="line-clamp-3">
                {content}
              </div>
            )}
          </div>
        )}

        <Tags limit={4} tag={tag} />
      </div>
    </div>
  );
};

export default BlogPost;
