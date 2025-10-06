import BlogPost from "@/components/BlogPost";
import LoadMore from "@/components/LoadMore";
import { connectToDatabase } from "@/lib/mongodb";
import Post, { IPost } from "@/models/Post";
import { PopulatedClientPost } from "@/types/post";
import { Metadata } from "next";

export const revalidate = 600; // refresh every 10 minutes

// interface LeanPost extends Omit<IPost, "creator" | "date" | "_id"> {
//   _id: string;
//   creator: { username: string } | string;
//   date: string;
// }



export const metadata:Metadata = {
  title: "All Posts | The Blog GPT - AI-Powered Blog Platform",
  description:
    "Browse all AI-generated blog posts powered by Gemini AI on The Blog GPT. Explore trending topics, discover insightful content, and get inspired by AI-driven creativity.",
  keywords: [
    "AI blog posts",
    "all blogs",
    "Blog-GPT",
    "Gemini AI blog",
    "Next.js blogging",
    "AI content generation",
    "modern blog platform",
    "trending blog posts",
    "AI-written articles",
  ],
  authors: [
    {
      name: "Vignesh A S",
      url: "https://a-s-vignesh-portfolio.vercel.app",
    },
  ],
  openGraph: {
    title: "All Posts - The Blog GPT",
    description:
      "Discover all AI-generated blog posts from The Blog GPT. Explore trending articles and the latest in AI-driven storytelling.",
    url: "https://thebloggpt.com/post",
    siteName: "The Blog GPT",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "https://thebloggpt.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "All Posts - The Blog GPT",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "All Posts - The Blog GPT",
    description:
      "Browse all AI-generated blog posts on The Blog GPT, powered by Gemini AI.",
    images: [
      {
        url: "https://thebloggpt.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "All Posts - The Blog GPT",
      },
    ],
  },
  metadataBase: new URL("https://thebloggpt.com"),
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://thebloggpt.com/post",
  },
};

export default async function PostPage() {
  await connectToDatabase();

  const initialPosts = await Post.find({})
    .sort({ updatedAt: -1, date: -1 })
    .limit(6)
    .populate("creator", "username")
    .lean<PopulatedClientPost[]>();

  return (
    <>
      <section className="py-16 px-6 sm:px-16 md:px-20 lg:px-28 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Post{" "}
            <span className="text-blue-600 dark:text-blue-400">
              The Blog GPT
            </span>
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
            Here you can find all the blog posts
          </p>
        </div>
      </section>

      <section className="padding min-h-screen px-6 sm:px-16 md:px-20 lg:px-28 py-3 sm:py-4 bg-white dark:bg-dark-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-x-10 lg:gap-x-16 mt-2 md:mt-4">
          {initialPosts.length > 0 ? (
            initialPosts.map((post) => <BlogPost key={post._id} post={post} />)
          ) : (
            <h2 className="text-center sub_heading mt-4 w-full">
              No blog posts found!
            </h2>
          )}
        </div>

        <LoadMore />
      </section>
    </>
  );
}
