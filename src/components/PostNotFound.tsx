import Link from "next/link";
import { TbFileX } from "react-icons/tb";

export default function PostNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-white dark:bg-dark-100">
      <TbFileX className="text-red-500 text-6xl mb-4" />
      <h1 className="text-3xl font-bold text-red-600">Post Not Found</h1>
      <p className="text-gray-600 dark:text-gray-300 mt-3 max-w-md">
        Sorry, the blog post you're looking for doesn’t exist or may have been
        removed.
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
