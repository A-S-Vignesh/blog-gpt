import React from 'react';

const LoadingSkeleton = ({ count = 1 }) => {
  return (
    <div className="w-full flex flex-col sm:flex-row items-center justify-center flex-wrap gap-6 sm:gap-x-10 lg:gap-x-16">
      {[...Array(count)].map((_, index) => (
        <div
          key={index}
          className="flex w-full sm:w-[390px] rounded-md max-h-max gap-2 mb-6 flex-col animate-pulse"
        >
          {/* Image skeleton */}
          <div className="bg-gray-200 dark:bg-gray-700 h-[250px] w-full rounded-md" />
          
          {/* Date skeleton */}
          <div className="bg-gray-200 dark:bg-gray-700 h-4 w-52 rounded mt-4" />
          
          {/* Title skeleton */}
          <div className="bg-gray-200 dark:bg-gray-700 h-6 w-2/3 rounded mt-4" />
          
          {/* Content skeleton */}
          <div className="mt-4 space-y-3">
            <div className="bg-gray-200 dark:bg-gray-700 h-4 w-5/6 rounded" />
            <div className="bg-gray-200 dark:bg-gray-700 h-4 w-5/6 rounded" />
            <div className="bg-gray-200 dark:bg-gray-700 h-4 w-3/6 rounded" />
          </div>
          
          {/* Tags skeleton */}
          <div className="flex gap-2 mt-4">
            <div className="bg-gray-200 dark:bg-gray-700 h-6 w-16 rounded" />
            <div className="bg-gray-200 dark:bg-gray-700 h-6 w-16 rounded" />
            <div className="bg-gray-200 dark:bg-gray-700 h-6 w-16 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default LoadingSkeleton; 