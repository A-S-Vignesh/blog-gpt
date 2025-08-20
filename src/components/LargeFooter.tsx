"use client";

import Link from "next/link";
import React from "react";

function LargeFooter() {

  return (
    <footer className="bg-[#E8E8EA] dark:bg-[#141624] px-6 sm:px-16 md:px-20 lg:px-28 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Top grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8  pb-10">
          {/* Brand / Intro */}
          <div>
            <h3 className="text-xl font-bold text-black dark:text-white mb-4">
              The Blog GPT
            </h3>
            <p className="mb-4 text-[#667085] dark:text-[#C0C5D0] text-sm">
              AI-powered platform for creating, editing, and publishing
              professional blog content instantly.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-lg font-semibold text-black dark:text-white mb-4">
              Navigation
            </h4>
            <ul className="space-y-2">
              {[
                { name: "Home", href: "/" },
                { name: "About", href: "/about" },
                { name: "Contact", href: "/contact" },
                // { name: "Pricing", href: "/pricing" },
              ].map(({ name, href }) => (
                <li key={name}>
                  <Link
                    href={href}
                    className="text-[#667085] dark:text-[#C0C5D0] hover:text-black dark:hover:text-white transition"
                  >
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-lg font-semibold text-black dark:text-white mb-4">
              Resources
            </h4>
            <ul className="space-y-2">
              {[
                { name: "Blog", href: "/post" },
                // { name: "Documentation", href: "/docs" },
                // { name: "Tutorials", href: "/tutorials" },
                // { name: "Support", href: "/contact" },
              ].map(({ name, href }) => (
                <li key={name}>
                  <Link
                    href={href}
                    className="text-[#667085] dark:text-[#C0C5D0] hover:text-black dark:hover:text-white transition"
                  >
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-lg font-semibold text-black dark:text-white mb-4">
              Legal
            </h4>
            <ul className="space-y-2">
              {[
                { name: "Terms of Use", href: "/terms-of-use" },
                { name: "Privacy Policy", href: "/privacy-policy" },
                { name: "Cookie Policy", href: "/cookies-policy" },
              ].map(({ name, href }) => (
                <li key={name}>
                  <Link
                    href={href}
                    className="text-[#667085] dark:text-[#C0C5D0] hover:text-black dark:hover:text-white transition"
                  >
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        
      </div>
    </footer>
  );
}

export default LargeFooter;
