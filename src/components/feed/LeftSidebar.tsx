"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  FaHome,
  FaCompass,
  FaBookmark,
  FaUser,
  FaCog,
  FaTimes,
  FaPenAlt,
} from "react-icons/fa";

const LeftSidebar = ({
  user,
  onClose,
}: {
  user: any;
  onClose?: () => void;
}) => {
  const pathname = usePathname();

  // The /[username] route canonicalizes to lowercase (mixed-case URLs 301 to
  // their lowercase form), so the live pathname is always lowercase. Build the
  // profile link lowercase too — otherwise a user like "Vignesh-Devil" links to
  // /Vignesh-Devil, gets redirected to /vignesh-devil, and the exact-match
  // active check below never matches.
  const profileHref = user?.username
    ? `/${user.username.toLowerCase()}`
    : undefined;

  const navItems = [
    { id: "home", label: "Home", href: "/feed", icon: <FaHome /> },
    { id: "explore", label: "Explore", href: "/explore", icon: <FaCompass /> },
    {
      id: "bookmarks",
      label: "Bookmarks",
      href: "/bookmarks",
      icon: <FaBookmark />,
    },
    {
      id: "profile",
      label: "Profile",
      href: profileHref ?? "#",
      icon: <FaUser />,
    },
    { id: "settings", label: "Settings", href: "/settings", icon: <FaCog /> },
  ];

  const isActive = (href: string) => {
    if (href === "/feed") return pathname === "/feed" || pathname === "/";
    // Profile route: match exactly /<username> (case-insensitive — the route
    // canonicalizes mixed-case usernames to lowercase).
    if (profileHref && href === profileHref) {
      return pathname.toLowerCase() === profileHref;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="w-64 h-full bg-white dark:bg-dark-100 border-r border-gray-200 dark:border-gray-700 p-6 flex flex-col overflow-y-auto">
      {/* Mobile Header */}
      <div className="flex justify-between items-center mb-8 lg:hidden">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
            <FaPenAlt className="text-white text-sm" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white">
            BlogGPT
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800"
        >
          <FaTimes className="text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      {/* Write Button */}
      <Link
        href="/post/create"
        onClick={onClose}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium py-3 rounded-xl mb-8 flex items-center justify-center hover:opacity-90 transition"
      >
        <FaPenAlt className="mr-2" />
        Write a Post
      </Link>

      {/* Navigation Menu */}
      <div className="space-y-1 mb-10">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={onClose}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition font-medium ${
                active
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <span
                className={`mr-3 text-lg ${active ? "text-blue-600 dark:text-blue-400" : ""}`}
              >
                {item.icon}
              </span>
              {item.label}
              {active && (
                <span className="ml-auto w-1.5 h-5 rounded-full bg-blue-600 dark:bg-blue-400" />
              )}
            </Link>
          );
        })}
      </div>

      {/* User Profile */}
      <div className="mt-auto pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <div className="relative w-10 h-10 rounded-full overflow-hidden mr-3">
            <Image
              src={user?.image || "/assets/images/default-avatar.png"}
              alt={user?.name || "User"}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {user?.name || "User"}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              @{user?.username || "username"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeftSidebar;
