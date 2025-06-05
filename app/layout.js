import Provider from "@/providers/Provider";
import "../styles/globals.css";
import Nav from "@/components/Nav";
import ReduxProvider from "@/providers/ReduxProvider";
import Footer from "@/components/Footer";
import { Suspense } from "react";

import Loading from "./loading";
import Head from "next/head";

export const metadata = {
  title: "The Blog GPT",
  description: "Blog website with CRUD operations",
  icons: { icon: "./assets/images/favicon.png" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <Head>
        {/* Google Analytics script */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-VWS6MTPDHT"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-VWS6MTPDHT');
            `,
          }}
        />
      </Head>
      <body className="">
        <ReduxProvider>
          <Provider>
            <Nav />
            <Suspense  fallback={<Loading />}>
              {children}
            </Suspense>
            <Footer />
          </Provider>
        </ReduxProvider>
      </body>
    </html>
  );
}
