import Link from "next/link";
import { FaLock } from "react-icons/fa";

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-white dark:bg-dark-100">
      <FaLock className="text-red-500 text-6xl mb-4" />

      <h1 className="text-4xl font-bold text-red-600">
        403 - Unauthorized Access
      </h1>

      <p className="text-gray-600 dark:text-gray-300 mt-4 max-w-md">
        You don’t have permission to view or modify this page. If you believe
        this is a mistake, please contact support.
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
