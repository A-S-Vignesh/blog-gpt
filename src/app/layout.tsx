// app/layout.tsx
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/redux/provider";
import CommonFooter from "@/components/CommonFooter";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "next-themes";
import ToastProvider from "@/provider/ToastProvider";
import CookiesBox from "@/components/CookiesBox";
import AnalyticsLoader from "@/components/AnalyticsLoader";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Blog GPT",
  description:
    "A modern blog website where you can view posts and generate content using AI.",
  keywords: [
    "AI blog",
    "The Blog GPT",
    "AI content generation",
    "modern blogging",
    "AI tools",
    "Gemini AI blogs",
  ],
  authors: [
    {
      name: "Vignesh A S",
      url: "https://a-s-vignesh-portfolio.vercel.app",
    },
  ],
  metadataBase: new URL("https://thebloggpt.com"),
  openGraph: {
    title: "The Blog GPT",
    description:
      "A modern blog website where you can view posts and generate content using AI.",
    url: "https://thebloggpt.com",
    siteName: "The Blog GPT",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.jpg",
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
      "A modern blog platform with AI-generated content and creative blogging tools.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "The Blog GPT",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="bg-white dark:bg-dark-100"
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ToastProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <Providers>
              {/* Sticky-footer layout. Without this wrapper the body isn't a
                  flex column, so the footer's `mt-auto` does nothing and the
                  footer can briefly render directly below the navbar while
                  the page content is still streaming in (visible layout
                  shift). The `flex flex-col min-h-screen` wrapper guarantees
                  the page-content area always claims at least the remaining
                  viewport height, keeping the footer pinned to the bottom
                  even before React hydrates. */}
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <div className="flex-1 flex flex-col min-w-0">{children}</div>
                <CommonFooter />
              </div>
              <CookiesBox />
            </Providers>
          </ThemeProvider>
        </ToastProvider>
        <AnalyticsLoader />
      </body>
    </html>
  );
}
