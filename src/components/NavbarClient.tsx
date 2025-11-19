"use client";

import { signIn, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
// import { useSelector, useDispatch } from "react-redux";
import DarkModeToggle from "@/components/DarkModeToggle";
import {
  FaUser,
  FaPen,
  FaRobot,
  FaBars,
  FaTimes,
  FaHome,
  FaBlog,
  FaEnvelope,
  FaInfoCircle,
  FaSignOutAlt,
} from "react-icons/fa";
import { useTheme } from "next-themes";
// import { BuiltInProviderType } from "next-auth/providers/google";

interface UserDataType {
  _id?: string;
  name?: string | null;
  image?: string | null;
  email?: string | null;
  username?: string;
}

interface NavbarClientProps {
  userData: UserDataType | null;
}


const NavbarClient = ({ userData }: NavbarClientProps) => {
const [isOpen, setIsOpen] = useState<boolean>(false);
    const { theme, setTheme } = useTheme();
    // const [isDarkMode,setDarkMode]=use
    const isDarkMode = theme === "dark";

const mobileMenuRef = useRef<HTMLDivElement | null>(null);
const profileRef = useRef<HTMLDivElement | null>(null);

const [hasMounted, setHasMounted] = useState<boolean>(false);


useEffect(() => {
  setHasMounted(true);
}, []);

  useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (
      mobileMenuRef.current &&
      !mobileMenuRef.current.contains(event.target as Node) &&
      profileRef.current &&
      !profileRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);


  
  const NavSkeleton = () => (
    <div className="animate-pulse flex gap-4 items-center">
      <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-full" />
      <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded-full" />
      <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-full" />
      <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
    </div>
  );

  const navLinks = [
    { name: "Home", href: "/", icon: <FaHome /> },
    { name: "Blog", href: "/post", icon: <FaBlog />},
    { name: "About", href: "/about", icon: <FaInfoCircle />},
    { name: "Contact", href: "/contact", icon: <FaEnvelope />},
  ];
    
  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-dark-100 border-b border-gray-200 dark:border-gray-700 px-6 sm:px-16 md:px-20 lg:px-28 py-3">
      <div className="flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <div className="w-[175px] h-[60px] relative mr-3">
              {hasMounted ? (
                <Image
                  src={
                    isDarkMode
                      ? "/assets/images/LightLogo.png"
                      : "/assets/images/BlackLogo.png"
                  }
                  alt="logo"
                  fill
                  className="object-contain"
                  priority
                />
              ) : (
                <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-full" />
              )}
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex ml-10 space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition duration-300"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Desktop Right Section */}
        <div className="hidden lg:flex items-center space-x-6">
          {/* Dark Mode Toggle */}
          {hasMounted ? (
            <DarkModeToggle />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
          )}

          {/* Conditional Buttons */}
          {userData ? (
            <>
              <Link
                href="/post/generate"
                className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-300"
              >
                <FaRobot className="mr-2" /> Generate
              </Link>
              <Link
                href="/post/create"
                className="flex items-center border-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 font-medium py-2 px-4 rounded-lg hover:bg-blue-50 dark:hover:bg-dark-75 transition duration-300"
              >
                <FaPen className="mr-2" /> Create
              </Link>

              {/* Profile Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  className="flex items-center"
                  onClick={() => setIsOpen(!isOpen)}
                >
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-blue-500">
                    <Image
                      alt="profile"
                      className="object-cover"
                      fill
                      src={
                        userData.image || "/assets/images/default-avatar.png"
                      }
                    />
                  </div>
                </button>

                {isOpen && (
                  <div className="absolute right-0 top-full mt-3 w-56 bg-white dark:bg-dark-100 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <p className="font-bold text-gray-900 dark:text-white truncate">
                        {userData.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {userData.email}
                      </p>
                    </div>
                    <div className="py-2">
                      <Link
                        onClick={() => setIsOpen(false)}
                        className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        href={`/profile/${userData.username}`}
                      >
                        <FaUser className="mr-3" /> My Profile
                      </Link>
                      <Link
                        onClick={() => setIsOpen(false)}
                        className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        href="/settings"
                      >
                        <FaUser className="mr-3" /> Account Settings
                      </Link>
                    </div>
                    <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          signOut();
                        }}
                        className="flex items-center w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                      >
                        <FaSignOutAlt className="mr-3" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition duration-300"
            >
              Sign in
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden flex items-center space-x-4">
          {hasMounted ? (
            <DarkModeToggle />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
          )}

          <button
            onClick={() => setIsOpen(true)}
            className="text-gray-700 dark:text-gray-300 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            <FaBars size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div
          ref={mobileMenuRef}
          className="lg:hidden fixed inset-0 bg-white dark:bg-dark-100 z-50 p-6 transition-all duration-300"
        >
          <div className="flex justify-between items-center mb-10">
            <Link
              href="/"
              className="flex items-center"
              onClick={() => setIsOpen(false)}
            >
              <div className="w-[160px] h-[50px] relative mr-3">
                <Image
                  src={
                    isDarkMode
                      ? "/assets/images/LightLogo.png"
                      : "/assets/images/BlackLogo.png"
                  }
                  alt="logo"
                  fill
                  className="object-contain"
                />
              </div>
              {/* <span className="text-xl font-bold text-gray-900 dark:text-white">
                The Blog GPT
              </span> */}
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-700 dark:text-gray-300 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              <FaTimes size={24} />
            </button>
          </div>

          {/* Mobile Navigation Links */}
          <div className="space-y-4 mb-10">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="flex items-center py-3 px-4 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                onClick={() => setIsOpen(false)}
              >
                <span className="mr-3 text-lg">{link.icon}</span>
                <span className="text-lg font-medium">{link.name}</span>
              </Link>
            ))}
          </div>

          {/* Conditional Mobile Buttons */}
          {userData ? (
            <>
              <Link
                href="/post/generate"
                className="flex items-center justify-center py-3 px-4 mb-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
                onClick={() => setIsOpen(false)}
              >
                <FaRobot className="mr-3" /> Generate Blog
              </Link>
              <Link
                href="/post/create"
                className="flex items-center justify-center py-3 px-4 mb-4 border-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 font-medium rounded-lg hover:bg-blue-50 dark:hover:bg-dark-75 transition"
                onClick={() => setIsOpen(false)}
              >
                <FaPen className="mr-3" /> Create Post
              </Link>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex items-center mb-6">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-blue-500 mr-4">
                    <Image
                      alt="profile"
                      className="object-cover"
                      fill
                      src={
                        userData.image || "/assets/images/default-avatar.png"
                      }
                    />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">
                      {userData.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {userData.email}
                    </p>
                  </div>
                </div>

                <Link
                  onClick={() => setIsOpen(false)}
                  className="flex items-center py-3 px-4 mb-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                  href={`/profile/${userData.username}`}
                >
                  <FaUser className="mr-3" /> My Profile
                </Link>
                <Link
                  onClick={() => setIsOpen(false)}
                  className="flex items-center py-3 px-4 mb-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                  href="/settings"
                >
                  <FaUser className="mr-3" /> Account Settings
                </Link>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    signOut();
                  }}
                  className="flex items-center w-full py-3 px-4 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition mt-4"
                >
                  <FaSignOutAlt className="mr-3" /> Sign Out
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => {
                setIsOpen(false);
                signIn("google");
              }}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-300"
            >
              Sign in with Google
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default NavbarClient;
