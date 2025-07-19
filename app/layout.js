import Provider from "@/providers/Provider";
import "../styles/globals.css";
import Nav from "@/components/Nav";
import ReduxProvider from "@/providers/ReduxProvider";
import Footer from "@/components/Footer";
import { Suspense } from "react";
import { Toaster } from "react-hot-toast";

export const metadata = {
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
  icons: {
    icon: "/assets/images/favicon.png",
  },
  metadataBase: new URL("https://thebloggpt.vercel.app"),
  openGraph: {
    title: "The Blog GPT",
    description:
      "A modern blog website where you can view posts and generate content using AI.",
    url: "https://thebloggpt.vercel.app",
    siteName: "Blog-GPT",
    type: "website",
    locale: "en_US",
    images: ["/assets/images/og-default.jpg"], // optional
  },
  twitter: {
    card: "summary_large_image",
    title: "The Blog GPT",
    description:
      "A modern blog platform with AI-generated content and creative blogging tools.",
    images: ["/assets/images/og-default.jpg"], // optional
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};


export default function RootLayout({ children }) {
  const initialThemeScript = `
    (function () {
      try {
        const savedTheme = localStorage.getItem("theme");
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (_) {}
    })();
  `;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="bg-white dark:bg-dark-100"
    >
      <head>
        {/* Inject dark mode theme early to avoid flash */}
        <script dangerouslySetInnerHTML={{ __html: initialThemeScript }} />

        {/* Google Analytics */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-VWS6MTPDHT"
        />
        <script
          id="google-analytics"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-VWS6MTPDHT');
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-white dark:bg-dark-100">
        <ReduxProvider>
          <Provider>
            <Nav />
            <Toaster position="top-right" />
            <main className="flex-grow">
              <Suspense fallback={<p>Loading...</p>}>{children}</Suspense>
            </main>
            <Footer />
          </Provider>
        </ReduxProvider>
      </body>
    </html>
  );
}
