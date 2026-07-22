"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Routes that render inside the (app) AppShell (with the fixed LeftSidebar).
 * Anything NOT in this set is an in-app route. On those routes AppShell renders
 * the footer itself, inside the sidebar-offset content column — so the GLOBAL
 * footer (mounted in the root layout) bows out there to avoid a duplicate that
 * would slide under the fixed sidebar.
 *
 * Negative list because (app) routes include profile pages at /{username},
 * which can't be matched by a simple prefix.
 */
const NON_APP_FIRST_SEGMENTS = new Set<string>([
  "", // root /
  "about",
  "account",
  "api",
  "auth",
  "contact",
  "cookies-policy",
  "manifest.json",
  "pricing",
  "post",
  "privacy-policy",
  "robots.txt",
  "sitemap.xml",
  "terms-of-use",
  "403",
  "404",
  "_next",
]);

function isAppShellRoute(pathname: string): boolean {
  const first = pathname.split("/")[1] || "";
  return !NON_APP_FIRST_SEGMENTS.has(first);
}

/**
 * @param inShell  true when AppShell renders this footer inside its offset
 *                 content column. The global instance (root layout) leaves
 *                 this false and hides itself on (app) routes.
 */
const Footer = ({ inShell = false }: { inShell?: boolean }) => {
  const year = new Date().getFullYear();
  const pathname = usePathname() || "/";

  // Global footer: don't render on (app) routes — AppShell renders its own copy
  // inside the content column so it can't collide with the fixed sidebar.
  if (!inShell && isAppShellRoute(pathname)) return null;

  const footerLinks = [
    { name: "Terms of Use", href: "/terms-of-use" },
    { name: "Privacy Policy", href: "/privacy-policy" },
    { name: "Cookie Policy", href: "/cookies-policy" },
  ];

  const handleCookieSettings = () => {
    window.dispatchEvent(new Event("openCookieSettings"));
  };

  return (
    <footer className="bg-[#E8E8EA] mt-auto dark:bg-[#141624] border-t-2 border-t-gray-300 dark:border-t-white">
      <div className="px-6 sm:px-16 md:px-20 lg:px-28">
        <div className="flex lg:flex-row flex-col-reverse justify-between items-center p-3">
          {/* Left side */}
          <div className="flex flex-col items-center lg:items-start">
            <p className="text-[#667085] dark:text-[#C0C5D0] font-semibold text-base text-center lg:text-left">
              © {year} The Blog GPT. All Rights Reserved.
            </p>
          </div>

          {/* Right side */}
          <ul className="flex flex-wrap lg:flex-row flex-col gap-4 lg:gap-6 mb-3 lg:mb-0 items-center">
            {footerLinks.map(({ name, href }) => (
              <li key={name}>
                <Link
                  href={href}
                  className="text-[#667085] dark:text-[#C0C5D0] font-semibold text-sm cursor-pointer hover:text-black dark:hover:text-white"
                >
                  {name}
                </Link>
              </li>
            ))}
            <li>
              <button
                onClick={handleCookieSettings}
                className="text-[#667085] dark:text-[#C0C5D0] font-semibold text-sm cursor-pointer hover:text-black dark:hover:text-white"
              >
                Cookie Settings
              </button>
            </li>
            <li>
              <Link
                href="/privacy-policy#do-not-sell"
                className="text-[#667085] dark:text-[#C0C5D0] font-semibold text-sm cursor-pointer hover:text-black dark:hover:text-white"
              >
                Do Not Sell My Data
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
