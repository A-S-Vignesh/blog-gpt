import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import type { Metadata } from "next";
import { FaBookmark } from "react-icons/fa";
import { authOptions } from "@/lib/authOptions";
import { getUserBookmarks } from "@/lib/data/bookmarks";
import BookmarksClient from "@/components/bookmarks/BookmarksClient";

// User-specific page — cannot be statically generated, must render per request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your bookmarks | TheBlogGPT",
  description: "Posts you've saved to read later.",
  // Bookmarks are private — keep Google out.
  robots: { index: false, follow: false },
};

export default async function BookmarksPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?._id) {
    redirect("/auth/signin?callbackUrl=%2Fbookmarks");
  }

  // First page rendered server-side so the user sees their bookmarks
  // immediately with no client-fetch flash. Subsequent pages load on demand
  // via /api/account/bookmarks.
  const initialPage = await getUserBookmarks(session.user._id);

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FaBookmark className="text-yellow-500" />
            Your bookmarks
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Posts you've saved to read later. Removing a bookmark here doesn't
            delete the post, only your saved copy of the link.
          </p>
        </header>

        <BookmarksClient initialPage={initialPage} />
      </div>
    </div>
  );
}
