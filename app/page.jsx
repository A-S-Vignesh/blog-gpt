// app/page.jsx
import Hero from "@/components/Hero";
import SearchInput from "@/components/SearchInput";
import BlogPost from "@/components/BlogPost";
import LoadMore from "@/components/LoadMore"; // 👇 new client component below
import { connectToDB } from "@/db/database";
import Post from "@/db/models/post";
import User from "@/db/models/user";


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
    url: "https://thebloggpt.vercel.app",
    siteName: "The Blog GPT",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "https://thebloggpt.vercel.app/assets/images/favicon.png",
        width: 1200,
        height: 630,
        alt: "The Blog GPT Banner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Blog GPT",
    description:
      "Smart AI-powered blog content with a modern and responsive design.",
    images: ["https://thebloggpt.vercel.app/assets/images/favicon.png"],
  },
  metadataBase: new URL("https://thebloggpt.vercel.app"),
  robots: {
    index: true,
    follow: true,
  },
};


export const revalidate = 600; // 10 minutes

export default async function HomePage() {
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
    <section className="padding min-h-screen px-6 sm:px-16 md:px-20 lg:px-28 py-3 sm:py-4 bg-white dark:bg-dark-100">
      <Hero />
      <SearchInput />
      <hr className="hr" />

      {/* SSR: first grid is rendered on server for SEO */}
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
  );
}
