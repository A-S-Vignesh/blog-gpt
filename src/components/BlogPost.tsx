import Image from "next/image";
import Link from "next/link";
import React from "react";
import Tags from "@/components/Tags";
import Date from "@/components/Date";
import { IPost } from "@/models/Post";
import { ClientPost } from "@/types/post";
// import ReactMarkdown from "react-markdown";
// import remarkGfm from "remark-gfm";
// import rehypeRaw from "rehype-raw";

interface BlogPostProps {
  post: ClientPost;
}

const BlogPost: React.FC<BlogPostProps> = ({ post }) => {
  return (
    <div className="flex flex-col w-full sm:max-w-[390px] sm:w-full rounded-md max-h-max gap-2 mb-6">
      <div className="relative overflow-hidden rounded-md shrink-0 h-[250px] w-full sm:w-auto">
        <Link href={`/post/${post.slug}`} className="block w-full h-full">
          <Image
            src={post.image ? post.image : "/assets/images/laptop.jpg"}
            alt="post-image"
            fill
            className={`${
              post.image ? "" : "bg-gray-200 dark:bg-gray-700"
            } rounded-md object-cover hover:scale-110 transition ease-linear duration-200`}
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 390px"
            loading="lazy"
          />
        </Link>
      </div>

      <div className="content w-full">
        <Date date={post.date} creator={post.creator} />

        <Link
          href={`/post/${post.slug}`}
          className="text-[20px] sm:text-[24px] cursor-pointer line-clamp-1 capitalize mb-3 text-black dark:text-white font-semibold"
        >
          {post.title}
        </Link>

        {post.content && (
          <div className="para line-clamp-3 text-md">
            {/* <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
            > */}
            {post.content}
            {/* </ReactMarkdown> */}
          </div>
        )}

        
        <Tags limit={4} tags={post.tags} />
      </div>
    </div>
  );
};

export default BlogPost;
