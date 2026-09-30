import type { Metadata } from "next";
import { getPaginatedPosts } from "@/lib/data/posts";
import ExploreClient from "@/components/explore/ExploreClient";

// ISR — the public explore feed is server-rendered so Google can crawl every
// post card. Refreshes every 10 minutes; the comment/like routes invalidate
// individual post tags as needed.
export const revalidate = 600;

export const metadata: Metadata = {
  title: "Explore blogs | The Blog GPT",
  description:
    "Discover the latest AI-powered blog posts on The Blog GPT: trending writers, fresh ideas, niche topics. Search, filter, and find your next read.",
  alternates: { canonical: "https://thebloggpt.com/explore" },
  openGraph: {
    title: "Explore blogs | The Blog GPT",
    description:
      "Discover the latest AI-powered blog posts. Trending writers, fresh ideas, niche topics.",
    url: "https://thebloggpt.com/explore",
    siteName: "The Blog GPT",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "https://thebloggpt.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Explore blogs on The Blog GPT",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore blogs | The Blog GPT",
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
    // Width and padding come from AppShell (for guests too), same as every
    // other page.
    <ExploreClient initialPage={initialPage as any} />
  );
}
