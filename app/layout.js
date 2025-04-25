import Provider from "@/providers/Provider";
import "../styles/globals.css";
import Nav from "@/components/Nav";
import ReduxProvider from "@/providers/ReduxProvider";
import Footer from "@/components/Footer";
import { Suspense } from "react";

import Loading from "./loading";

export const metadata = {
  title: "The Blog GPT",
  description: "Blog website with CRUD operations",
  icons: { icon: "./assets/images/favicon.png" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
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
