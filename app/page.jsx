// app/page.jsx
import HomeClient from "@/components/HomeClient";

export const metadata = {
  title: "The Blog GPT | AI-Powered Blog Platform",
  description:
    "Explore AI-generated blogs using Gemini AI. Discover, read, and generate smart content instantly.",
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
        url: "https://thebloggpt.vercel.app/assets/images/LightLogo.png",
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
    images: ["https://thebloggpt.vercel.app/assets/images/LightLogo.png"],
  },
  metadataBase: new URL("https://thebloggpt.vercel.app"),
  viewport: "width=device-width, initial-scale=1",
  robots: {
    index: true,
    follow: true,
  },
};


export default function HomePage() {
  return <HomeClient />;
}
