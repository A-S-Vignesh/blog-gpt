"use client";
import React from "react";
import { InfinitySpin } from "react-loader-spinner";
import { useSelector } from "react-redux";

const LoadingSkeleton = () => {
  const isDarkMode = useSelector((state) => state.darkMode.isDarkMode);
  return (
    <div className="absolute w-full flex-col h-full bg-white dark:bg-dark-100 top-0 left-0 center">
      <InfinitySpin
        visible={true}
        width="200"
        color={isDarkMode ? "#fff" : "#000"}
        ariaLabel="infinity-spin-loading"
      />
    </div>
  );
};

export default LoadingSkeleton;
