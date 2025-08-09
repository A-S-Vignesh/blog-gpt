// app/page.jsx
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
  alternates: {
    canonical: "https://thebloggpt.com",
  },
};

export default function HomePage() {
  return <Home />;
}
