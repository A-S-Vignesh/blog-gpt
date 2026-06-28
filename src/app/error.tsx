"use client";

import { useEffect } from "react";
import Link from "next/link";
import { FaExclamationTriangle } from "react-icons/fa";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error to the console (and any attached monitoring) so it is
    // not silently swallowed by the boundary.
    console.error("[app-error-boundary]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-white dark:bg-dark-100">
      <FaExclamationTriangle className="text-yellow-500 text-6xl mb-4" />
      <h1 className="text-4xl font-bold text-red-600">Something went wrong</h1>
      <p className="text-gray-600 dark:text-gray-300 mt-4 max-w-md">
        An unexpected error occurred. You can try again, or head back home.
      </p>
      {error.digest && (
        <p className="text-gray-400 dark:text-gray-500 mt-2 text-xs">
          Reference: {error.digest}
        </p>
      )}
      <div className="mt-6 flex gap-3">
        <button
          onClick={() => reset()}
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-block border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-6 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-dark-200 transition"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
