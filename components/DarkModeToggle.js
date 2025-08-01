"use client";

import { darkModeActions } from "@/redux/slice/DarkMode";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

const DarkModeToggle = () => {
  const isDarkMode = useSelector((state) => state.darkMode.isDarkMode);
  const dispatch = useDispatch();

  // ✅ Apply class and persist to localStorage when state changes
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const handleClick = () => {
    dispatch(darkModeActions.toggleDarkMode());
  };

  const handleKeyDown = ({ key }) => {
    if (key === "Enter") {
      handleClick();
    }
  };

  return (
    <div
      role="checkbox"
      aria-checked={isDarkMode ? "true" : "false"}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
      className={`cursor-pointer w-11 h-5 bg-blue-500 dark:bg-gray-800 rounded-full relative px-1.5 flex items-center${
        isDarkMode ? "" : " justify-end"
      }`}
    >
      <div
        className={`w-4 h-4 rounded-full absolute transform duration-200 ease-out bg-white left-0.5 ${
          isDarkMode ? "translate-x-6" : "translate-x-0"
        }`}
      />
      {isDarkMode ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3 w-3 text-white"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3 w-3 text-white"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </div>
  );
};

export default DarkModeToggle;
