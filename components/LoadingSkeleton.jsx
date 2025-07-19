import React from "react";
import Image from "next/image";

const LoadingSkeleton = ({ count = 1 }) => {
  const image =
    "https://res.cloudinary.com/ddj4zaxln/image/upload/v1752838770/blog-gpt/posts/kpb7vlwm6hj7ourskgbz.png"; // Default image path
  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-x-10 lg:gap-x-16 mt-2 md:mt-4">
      {[...Array(count)].map((_, index) => (
        <div
          key={index}
          className="flex flex-col w-full sm:max-w-[390px] sm:w-full rounded-md max-h-max gap-2 mb-6 animate-pulse"
        >
          {/* Image skeleton */}
          <div className="relative overflow-hidden rounded-md h-[250px] w-full bg-gray-200 dark:bg-gray-700" />

          {/* Date + Creator skeleton */}
          <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded mt-2" />

          {/* Title skeleton */}
          <div className="h-6 w-2/3 bg-gray-200 dark:bg-gray-700 rounded mt-2" />

          {/* Content skeleton (3 lines) */}
          <div className="mt-2 space-y-2">
            <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 w-3/6 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>

          {/* Tags skeleton */}
          <div className="flex gap-2 mt-3 flex-wrap">
            <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default LoadingSkeleton;
