"use client";

import Link from "next/link";
import { FaShieldAlt } from "react-icons/fa"; // ← React Icons import

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-white dark:bg-dark-100">
      <FaShieldAlt className="w-16 h-16 text-red-500 mb-4" />
      <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
        Unauthorized Access
      </h1>
      <p className="text-gray-600 dark:text-gray-300 max-w-md">
        You don’t have permission to access this page or perform this action. If
        you believe this is an error, please contact support.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition"
      >
        Go Back Home
      </Link>
    </div>
  );
}
