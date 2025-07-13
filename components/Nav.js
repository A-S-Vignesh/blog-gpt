"use client";

import { getProviders, signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import DarkModeToggle from "./DarkModeToggle";
import { useSelector, useDispatch } from "react-redux";
import { darkModeActions } from "@/redux/slice/DarkMode";
import { useRouter } from "next/navigation";

const Nav = () => {
  const [toggleDropdown, setToggleDropdown] = useState(false);
  const [providers, setProviders] = useState(null);
  const { data: session, status } = useSession();
  const dropdownRef = useRef(null);
  const router = useRouter();
  const dispatch = useDispatch();
  // from the redux store
  const isDarkMode = useSelector((state) => state.darkMode.isDarkMode);
  const [hasMounted, setHasMounted] = useState(false);


useEffect(() => {
  setHasMounted(true);
}, []);
  useEffect(() => {
    //get the providers form the next-auth
    (async () => {
      const res = await getProviders();
      setProviders(res);
    })();
  }, []);

  

  const handleSignIn = async (id) => {
    await signIn(id);
  };
  const NavSkeleton = () => (
    <div className="animate-pulse flex gap-4 items-center">
      <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-full" />
      <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded-full" />
      <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-full" />
      <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
    </div>
  );


  return (
    <nav className="px-6 sm:px-16 md:px-20 lg:px-28 padding z-10 border-b-2 bg-white dark:bg-dark-100 border-black dark:border-white w-full  top-0  flex-between py-3 bg-transparent">
      <Link href="/" className="shrink-0">
        <div className="w-[175px] h-[60px] relative">
          {hasMounted ? (
            <Image
              src={`${
                isDarkMode
                  ? "/assets/images/LightLogo.png"
                  : "/assets/images/BlackLogo.png"
              }`}
              alt="logo"
              fill
              className="object-contain"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md" />
          )}
        </div>
      </Link>

      <div className="gap-4 sm:gap-6 center">
        {/* Nav links for large devieces */}
        <div className="lg:flex hidden relative">
          {status === "loading" ? (
            <NavSkeleton />
          ) : session?.user ? (
            <div className="center gap-x-6">
              <Link href="/post/generate" className="black_btn">
                Generate
              </Link>
              <Link href="/post/create" className="black_btn">
                Create Post
              </Link>
              <button onClick={signOut} className="outline_btn">
                Sign out
              </button>
              <div ref={dropdownRef} className="relative">
                <Image
                  alt="profile"
                  className="rounded-full cursor-pointer"
                  width={37}
                  height={37}
                  onClick={() => setToggleDropdown((prev) => !prev)}
                  src={
                    session?.user?.image || "/assets/images/default-avatar.png"
                  }
                />
                {toggleDropdown && (
                  <div className="dropdown">
                    <Link
                      onClick={() => setToggleDropdown((prev) => !prev)}
                      className="dropdown_link"
                      href={`/profile/${session.user.id}`}
                    >
                      My Profile
                    </Link>
                    <Link
                      onClick={() => setToggleDropdown((prev) => !prev)}
                      href="/post/generate"
                      className="dropdown_link"
                    >
                      Generate
                    </Link>
                    <Link
                      onClick={() => setToggleDropdown((prev) => !prev)}
                      className="dropdown_link"
                      href="/post/create"
                    >
                      Create Post
                    </Link>
                    <button onClick={signOut} className="w-full black_btn">
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {providers &&
                Object.values(providers).map((provider, i) => (
                  <div key={i} className="center gap-x-6">
                    <button
                      onClick={() => signIn(provider.id)}
                      className="outline_btn"
                    >
                      Generate
                    </button>
                    <button
                      type="button"
                      key={provider.name}
                      onClick={() => handleSignIn(provider.id)}
                      className="black_btn"
                    >
                      Sign in
                    </button>
                  </div>
                ))}
            </>
          )}
        </div>

        {/* Nav links for mobile devieces */}
        <div className="flex lg:hidden relative">
          {session?.user ? (
            <>
              <Image
                alt="profile"
                className="rounded-full cursor-pointer"
                width={37}
                height={37}
                onClick={() => setToggleDropdown((prev) => !prev)}
                src={
                  session?.user?.image || "/assets/images/default-avatar.png"
                }
              />
              {toggleDropdown && (
                <div className="dropdown">
                  <Link
                    onClick={() => setToggleDropdown((prev) => !prev)}
                    className="dropdown_link"
                    href={`/profile/${session.user.id}`}
                  >
                    My Profile
                  </Link>
                  <Link
                    onClick={() => setToggleDropdown((prev) => !prev)}
                    href="/post/generate"
                    className="dropdown_link"
                  >
                    Generate
                  </Link>
                  <Link
                    onClick={() => setToggleDropdown((prev) => !prev)}
                    className="dropdown_link"
                    href="/post/create  "
                  >
                    Create Post
                  </Link>
                  <button onClick={signOut} className="black_btn mt-3 w-full">
                    Sign Out
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="center gap-x-6">
              {providers &&
                Object.values(providers).map((provider) => (
                  <button
                    key={provider.name}
                    onClick={() => handleSignIn(provider.id)}
                    className="black_btn"
                  >
                    Sign In
                  </button>
                ))}
            </div>
          )}
        </div>
        {hasMounted ? (
          <DarkModeToggle />
        ) : (
          <div className="w-11 h-5 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
        )}
      </div>
    </nav>
  );
};

export default Nav;
