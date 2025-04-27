import { Inter } from "next/font/google";
import "../styles/globals.css";
import Nav from "@/components/Nav";
import ReduxProvider from "@/providers/ReduxProvider";
import Provider from "@/providers/Provider";
import Footer from "@/components/Footer";
import { Suspense } from "react";

import Loading from "./loading";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Blog GPT",
  description: "A blog platform powered by GPT",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        <ReduxProvider>
          <Provider>
            <Nav />
            <Suspense fallback={<Loading />}>
              <main className="min-h-screen w-full bg-white dark:bg-gray-900">
                {children}
              </main>
            </Suspense>
            <Footer />
          </Provider>
        </ReduxProvider>
      </body>
    </html>
  );
}
