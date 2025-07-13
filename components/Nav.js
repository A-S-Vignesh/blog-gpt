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
  const { data: session } = useSession();
  const dropdownRef = useRef(null);
  const router = useRouter();
  const dispatch = useDispatch();
  // from the redux store
  const isDarkMode = useSelector((state) => state.darkMode.isDarkMode);

  // Add inside useEffect for dark mode (replace your existing dark mode useEffect)
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      dispatch(darkModeActions.setDarkMode(true));
    } else if (savedTheme === "light") {
      dispatch(darkModeActions.setDarkMode(false));
    } else {
      // If no theme stored, check system preference
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      dispatch(darkModeActions.setDarkMode(prefersDark));
      localStorage.setItem("theme", prefersDark ? "dark" : "light");
    }
  }, [dispatch]);

  // Listen for Redux state changes and persist to localStorage
  useEffect(() => {
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    //get the providers form the next-auth
    (async () => {
      const res = await getProviders();
      setProviders(res);
    })();
  }, []);

  //for dark theme
  useEffect(() => {
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      dispatch(darkModeActions.toggleDarkMode(true));
    }
  }, []);

  const handleSignIn = async (id) => {
    await signIn(id);
  };

  return (
    <nav className="px-6 sm:px-16 md:px-20 lg:px-28 padding z-10 border-b-2 bg-white dark:bg-dark-100 border-black dark:border-white w-full  top-0  flex-between py-3 bg-transparent">
      <Link href="/">
        <Image
          src={`${
            isDarkMode
              ? "/assets/images/LightLogo.png"
              : "/assets/images/BlackLogo.png"
          }`}
          alt="logo"
          width={175}
          height={175}
          className="object-contain  shrink-0 flex"
        />
      </Link>
      <div className="gap-4 sm:gap-6 center">
        {/* Nav links for large devieces */}
        <div className="lg:flex hidden relative">
          {session?.user ? (
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
        <DarkModeToggle />
      </div>
    </nav>
  );
};

export default Nav;
