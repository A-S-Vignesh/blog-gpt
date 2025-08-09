export const revalidate = 600; // refresh every 1 hour

import Hero from "@/components/Hero";
import SearchInput from "@/components/SearchInput";
import BlogPost from "@/components/BlogPost";
import LoadMore from "@/components/LoadMore"; // 👇 new client component below
import { connectToDB } from "@/db/database";
import Post from "@/db/models/post";
import User from "@/db/models/user";
import Home from "@/components/Home";

export const metadata = {
  title: "The Blog GPT | AI-Powered Blog Platform",
  description:
    "Discover engaging AI-generated blogs powered by Gemini AI. Read insightful posts, explore trending topics, and generate smart content effortlessly on The Blog GPT.",
  keywords: [
    "AI blog",
    "Blog-GPT",
    "Gemini AI blog",
    "Vignesh A S",
    "Next.js blogging",
    "AI content generation",
    "Modern blog platform",
  ],
  authors: [
    {
      name: "Vignesh A S",
      url: "https://a-s-vignesh-portfolio.vercel.app",
    },
  ],
  openGraph: {
    title: "The Blog GPT",
    description:
      "Explore AI-generated blogs using Gemini AI. Discover, read, and generate smart content.",
    url: "https://thebloggpt.com",
    siteName: "The Blog GPT",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "https://thebloggpt.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "The Blog GPT",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Blog GPT",
    description:
      "Smart AI-powered blog content with a modern and responsive design.",
    images: [
      {
        url: "https://thebloggpt.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "The Blog GPT",
      },
    ],
  },
  metadataBase: new URL("https://thebloggpt.com"),
  robots: {
    index: true,
    follow: true,
  },
};

export default async function PostPage() {
  await connectToDB();
  const docs = await Post.find({})
    .sort({ date: -1 })
    .limit(6)
    .populate("creator", "username") // only fetch username & image
    .lean();

  // Make sure objects are serializable for RSC
  const initialPosts = docs.map((d) => ({
    ...d,
    _id: d._id.toString(),
    creator: d.creator, // if it’s an ObjectId
    date: (d.updatedAt || d.date)?.toISOString?.() || d.date,
  }));
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
            initialPosts.map((post) => <BlogPost key={post._id} {...post} />)
          ) : (
            <h2 className="text-center sub_heading mt-4 w-full">
              No blog posts found!
            </h2>
          )}
        </div>

        {/* Client side continues loading more pages + keeps your UX */}
        <LoadMore initialSkip={1} />
      </section>
    </>
  );
}
