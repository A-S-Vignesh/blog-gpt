"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function Error() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <div className="flex flex-col items-center mt-10 p-10">
        <h1 className="text-4xl font-bold mb-8">Authentication Error</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error || "An error occurred during authentication"}
        </div>
        <Link href="/" className="black_btn mt-4">
          Return Home
        </Link>
      </div>
    </div>
  );
} 