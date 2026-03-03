"use client";

import React from "react";
import Link from "next/link";

const Footer = () => {
  const year = new Date().getFullYear();

  const footerLinks = [
    { name: "Terms of Use", href: "/terms-of-use" },
    { name: "Privacy Policy", href: "/privacy-policy" },
    { name: "Cookie Policy", href: "/cookies-policy" },
  ];

  return (
    <div className="bg-[#E8E8EA] mt-auto dark:bg-[#141624] px-6 sm:px-16 md:px-20 lg:px-28 border-t-2 border-t-gray-300 dark:border-t-white">
      <div className="flex lg:flex-row flex-col-reverse justify-between items-center p-3">
        {/* Left side */}
        <div className="flex flex-col items-center lg:items-start">
          <p className="text-[#667085] dark:text-[#C0C5D0] font-semibold text-base text-center lg:text-left">
            © {year} TheBlogGPT. All Rights Reserved.
          </p>
          <p className="text-[#667085] dark:text-[#C0C5D0] text-sm mt-1 text-center lg:text-left">
            Developed by{" "}
            <Link
              href="https://codolve.com"
              target="_blank"
              rel="nofollow"
              className="bg-clip-text text-transparent bg-gradient-to-r dark:from-cyan-400 from-cyan-600 dark:to-blue-400 to-blue-600 font-semibold hover:opacity-80 transition"
            >
              Codolve
            </Link>
          </p>
        </div>

        {/* Right side */}
        <ul className="flex lg:flex-row flex-col gap-4 lg:gap-8 mb-3 lg:mb-0">
          {footerLinks.map(({ name, href }) => (
            <li key={name}>
              <Link
                href={href}
                className="text-[#667085] dark:text-[#C0C5D0] font-semibold text-base cursor-pointer hover:text-black dark:hover:text-white"
              >
                {name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Footer;
