import type { Metadata } from "next";
import { getPaginatedPosts } from "@/lib/data/posts";
import ExploreClient from "@/components/explore/ExploreClient";

// ISR — the public explore feed is server-rendered so Google can crawl every
// post card. Refreshes every 10 minutes; the comment/like routes invalidate
// individual post tags as needed.
export const revalidate = 600;

export const metadata: Metadata = {
  title: "Explore blogs | TheBlogGPT",
  description:
    "Discover the latest AI-powered blog posts on TheBlogGPT: trending writers, fresh ideas, niche topics. Search, filter, and find your next read.",
  alternates: { canonical: "https://thebloggpt.com/explore" },
  openGraph: {
    title: "Explore blogs | TheBlogGPT",
    description:
      "Discover the latest AI-powered blog posts. Trending writers, fresh ideas, niche topics.",
    url: "https://thebloggpt.com/explore",
    siteName: "TheBlogGPT",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "https://thebloggpt.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Explore blogs on TheBlogGPT",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore blogs | TheBlogGPT",
    description:
      "Discover the latest AI-powered blog posts. Search, filter, and find your next read.",
    images: ["https://thebloggpt.com/og-image.jpg"],
  },
  robots: { index: true, follow: true },
};

export default async function ExplorePage() {
  // First page rendered server-side — the cards appear in the initial HTML
  // before any JS runs, which makes the page indexable and faster to paint.
  const initialPage = await getPaginatedPosts({ skip: 0 });

  return (
    <div className="min-h-screen bg-white dark:bg-dark-100 py-6">
      {/* `max-w-7xl mx-auto` keeps content from stretching edge-to-edge on
          wide monitors for guests (who don't get the AppShell sidebar offset
          to constrain the layout). Side padding scales with breakpoint so
          there's a comfortable gutter at every screen size. */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10 lg:px-12 xl:px-16">
        <ExploreClient initialPage={initialPage as any} />
      </div>
    </div>
  );
}
