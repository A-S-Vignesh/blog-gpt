"use client";

import Link from "next/link";
import { FaExclamationTriangle } from "react-icons/fa";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-white dark:bg-dark-100">
      <FaExclamationTriangle className="text-yellow-500 text-6xl mb-4" />
      <h1 className="text-4xl font-bold text-red-600">404 - Page Not Found</h1>
      <p className="text-gray-600 dark:text-gray-300 mt-4 max-w-md">
        Sorry, the page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
      >
        Go Back Home
      </Link>
    </div>
  );
}
