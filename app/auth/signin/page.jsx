"use client";

import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import {  FaLock, FaEnvelope } from "react-icons/fa";
import { useSelector } from "react-redux";
import Image from "next/image";
import Link from "next/link";

const LoginPage = () => {
    const isDarkMode = useSelector((state) => state.darkMode.isDarkMode);
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center px-4 py-12">
      <div className="max-w-4xl mx-auto w-full">
        <div className="flex flex-col lg:flex-row items-stretch justify-between bg-white dark:bg-dark-100 rounded-3xl shadow-xl overflow-hidden">
          <div className="w-full lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-600 p-10 text-white flex flex-col justify-between">
            <div>
              <div className="flex items-center mb-8">
                <Image
                  src="/assets/images/LightLogo.png"
                  alt="Logo"
                  width={200}
                  height={50}
                  className="rounded-full mr-3"
                />
              </div>

              <h2 className="text-4xl font-bold mt-16 mb-6">Welcome Back!</h2>
              <p className="text-blue-100 max-w-md">
                Access your account to create, manage, and publish AI-powered
                content with Gemini AI.
              </p>
            </div>

            <div className="mt-16">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-500/30 p-3 rounded-xl">
                  <FaEnvelope className="text-xl" />
                </div>
                <div>
                  <p className="font-bold">Secure & Private</p>
                  <p className="text-blue-100 text-sm">
                    Your data is always protected
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 mt-4">
                <div className="bg-blue-500/30 p-3 rounded-xl">
                  <FaLock className="text-xl" />
                </div>
                <div>
                  <p className="font-bold">One-Click Login</p>
                  <p className="text-blue-100 text-sm">
                    No passwords to remember
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full lg:w-1/2 p-8 sm:p-12">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                Sign in to your account
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Continue your content creation journey
              </p>
            </div>

            {/* Google Sign-in Button */}
            <div className="mb-8">
              <button
                onClick={() => signIn("google")}
                className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white bg-white dark:bg-dark-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition duration-300"
              >
                <FcGoogle className="text-xl mr-3" />
                Sign in with Google
              </button>
            </div>

            <div className="flex items-center my-8">
              <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
              <span className="mx-4 text-gray-500 dark:text-gray-400">or</span>
              <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
            </div>

            {/* Email Form - Placeholder for future */}
            <form className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="text-gray-500 dark:text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-dark-100 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="you@example.com"
                    disabled
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="text-gray-500 dark:text-gray-400" />
                  </div>
                  <input
                    type="password"
                    id="password"
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-dark-100 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                    disabled
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                  >
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a
                    href="#"
                    className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                    disabled
                  >
                    Forgot password?
                  </a>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gray-400 cursor-not-allowed"
                  disabled
                >
                  Sign in (Coming Soon)
                </button>
              </div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{" "}
                <button
                  onClick={() => signIn("google")}
                  className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Sign up with Google
                </button>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            By signing in, you agree to our{" "}
            <Link
              href="/terms-of-use"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Terms of Use
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy-policy"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
