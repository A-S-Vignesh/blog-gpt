import { formattedDate } from "@/utils/dateFormat";
import Link from "next/link";
import React from "react";

interface Creator {
  username: string;
}

interface PostDateProps {
  creator?: string | Creator | null;
  date?: string | null;
}



const PostDate: React.FC<PostDateProps> = ({ date, creator }) => {
  return (
    <p
      className={`${
        !date ? "skeloten_loading w-52 h-4" : ""
      } font-semibold capitalize text-[15px] mb-4 text-[#6941C6]`}
    >
      {creator ? (
        typeof creator === "string" ? (
          <Link href={`/profile/${creator}`}>
            <span>{creator}</span>
            {" - "}
            {date && formattedDate(date)}
          </Link>
        ) : (
          <Link href={`/profile/${creator.username}`}>
            <span>{creator.username}</span>
            {" - "}
            {date && formattedDate(date)}
          </Link>
        )
      ) : (
        date && formattedDate(date)
      )}
    </p>
  );
};

export default PostDate;
