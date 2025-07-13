import Provider from "@/providers/Provider";
import "../styles/globals.css";
import Nav from "@/components/Nav";
import ReduxProvider from "@/providers/ReduxProvider";
import Footer from "@/components/Footer";
import { Suspense } from "react";
import Loading from "./loading";
import Script from "next/script";

export const metadata = {
  title: "The Blog GPT",
  description:
    "A modern blog website where you can view posts and generate content using AI.",
  icons: {
    icon: "/assets/images/favicon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* ✅ Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-VWS6MTPDHT"
          strategy="afterInteractive"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-VWS6MTPDHT');
            `,
          }}
        />

        <ReduxProvider>
          <Provider>
            <Nav />
            <Suspense fallback={<Loading />}>{children}</Suspense>
            <Footer />
          </Provider>
        </ReduxProvider>
      </body>
    </html>
  );
}
