// app/layout.tsx
import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/redux/provider";
import CommonFooter from "@/components/CommonFooter";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "next-themes";

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
    "Blog-GPT",
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
    siteName: "Blog-GPT",
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
      <head>
        <meta name="color-scheme" content="light dark" />
        <meta name="apple-mobile-web-app-title" content="Blog GPT" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-VWS6MTPDHT"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-VWS6MTPDHT');
          `}
        </Script>

        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Providers>
            <Navbar />
            {children}
            <CommonFooter />
          </Providers>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
