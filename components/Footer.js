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
    <div className="bg-[#E8E8EA] mt-auto dark:bg-[#141624] px-6 sm:px-16 md:px-20 lg:px-28 padding border-t-2 border-t-gray-300 dark:border-t-white">
      <div className="flex lg:flex-row flex-col-reverse justify-between">
        <p className="text-[#667085] m-2 text-center dark:text-[#C0C5D0] font-semibold text-base">
          © Vignesh A S {year}. All Rights Reserved.
        </p>

        <ul className="flex lg:flex-row flex-col center gap-4 lg:gap-8">
          {footerLinks.map(({ name, href }) => (
            <li key={name}>
              <Link
                href={href}
                className="text-[#667085] cursor-pointer dark:hover:text-white hover:text-black
                  dark:text-[#C0C5D0] font-semibold text-base"
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
