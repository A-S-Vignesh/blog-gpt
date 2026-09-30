"use client";

import Link from "next/link";
import {
  FaArrowRight,
  FaBullhorn,
  FaLightbulb,
  FaQuestionCircle,
} from "react-icons/fa";
import AdSlot from "@/components/ads/AdSlot";
import { AD_PLACEMENTS, formatCentsShort } from "@/config/ads";

const SIDEBAR_DAY_RATE = formatCentsShort(AD_PLACEMENTS.sidebar.dayRateCents);

/**
 * House ad for the sidebar slot, shown only while no advertiser has booked it.
 * It sits exactly where a paid ad would, so it explains itself, and it steps
 * aside the moment a real campaign runs.
 */
function AdvertiseHereCard() {
  return (
    <Link
      href="/advertise"
      className="group block rounded-2xl border border-dashed border-blue-300 bg-linear-to-br from-blue-50 to-indigo-50 p-5 transition hover:border-blue-500 hover:shadow-md dark:border-blue-800 dark:from-blue-950/40 dark:to-indigo-950/30 dark:hover:border-blue-500"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm text-white">
          <FaBullhorn />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
          Your ad here
        </span>
      </div>
      <p className="mt-3 font-semibold leading-snug text-gray-900 dark:text-white">
        Promote your product to The Blog GPT readers
      </p>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Book this spot from {SIDEBAR_DAY_RATE} a day. One flat price, reviewed
        by a person.
      </p>
      <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400">
        Advertise with us
        <FaArrowRight className="text-xs transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

// Surfaced in the sidebar because the feed is an infinite scroll, so the page
// footer is effectively unreachable (the same reason Instagram puts these here).
const FOOTER_LINKS = [
  { name: "About", href: "/about" },
  { name: "Pricing", href: "/billing" },
  { name: "Contact", href: "/contact" },
  { name: "Advertise", href: "/advertise" },
  { name: "Privacy", href: "/privacy-policy" },
  { name: "Terms", href: "/terms-of-use" },
  { name: "Cookies", href: "/cookies-policy" },
];

const RightSidebar = () => {
  const year = new Date().getFullYear();

  const handleCookieSettings = () => {
    window.dispatchEvent(new Event("openCookieSettings"));
  };

  return (
    <div className="space-y-8">
      {/* Sponsored slot. When no campaign is eligible it shows our own
          "advertise here" card, which is how advertisers find /advertise now
          that it is no longer in the left nav. */}
      <AdSlot placement="sidebar" fallback={<AdvertiseHereCard />} />

      {/* AI Tips */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
            <FaLightbulb className="text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            AI Writing Tip
          </h3>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
          Use specific prompts for better results. Instead of &quot;Write about
          AI&quot;, try &quot;Write a beginner-friendly guide to machine
          learning algorithms for web developers.&quot;
        </p>
      </div>

      {/* Help & Support */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-3">
            <FaQuestionCircle className="text-gray-600 dark:text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Need Help?
          </h3>
        </div>
        <div className="space-y-2">
          <Link
            href="/post/create"
            className="block text-gray-600 dark:text-gray-400 text-sm hover:text-blue-600 dark:hover:text-blue-400"
          >
            How to write your first post
          </Link>
          <Link
            href="/post/generate"
            className="block text-gray-600 dark:text-gray-400 text-sm hover:text-blue-600 dark:hover:text-blue-400"
          >
            Using AI to generate content
          </Link>
          <Link
            href="/terms-of-use"
            className="block text-gray-600 dark:text-gray-400 text-sm hover:text-blue-600 dark:hover:text-blue-400"
          >
            Community guidelines
          </Link>
        </div>
      </div>

      {/* Site links + copyright. Kept visible here because the feed scrolls
          infinitely, so the page footer is hard to reach. */}
      <nav aria-label="Site links" className="px-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-gray-500">
          {FOOTER_LINKS.map(({ name, href }) => (
            <span key={name} className="inline-flex items-center gap-x-2">
              <Link
                href={href}
                className="hover:text-gray-700 dark:hover:text-gray-300 hover:underline"
              >
                {name}
              </Link>
              <span aria-hidden="true" className="text-gray-300 dark:text-gray-700">
                ·
              </span>
            </span>
          ))}
          <button
            type="button"
            onClick={handleCookieSettings}
            className="hover:text-gray-700 dark:hover:text-gray-300 hover:underline"
          >
            Cookie settings
          </button>
        </div>
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-600">
          © {year} The Blog GPT
        </p>
      </nav>
    </div>
  );
};

export default RightSidebar;
