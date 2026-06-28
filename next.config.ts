import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  /**
   * Permanent (301) redirects for legacy URLs.
   *
   * These run BEFORE the app router resolves the request, so old URLs that
   * Google has already indexed (or anyone has shared) keep their SEO juice
   * by sending the user — and crawlers — to the canonical destination.
   *
   * NOT included here:
   *   /post/{slug} → /{username}/{slug}
   *     We can't 301 it statically because we don't know the username from
   *     just the slug. That redirect is handled by a dedicated server page
   *     at /post/[slug]/page.tsx which does a DB lookup + permanentRedirect.
   */
  redirects: async () => [
    // Old post-listing route → unified discovery surface
    { source: "/post", destination: "/explore", permanent: true },
    // Old profile URL pattern → canonical /{username}
    {
      source: "/profile/:username",
      destination: "/:username",
      permanent: true,
    },
  ],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
        search: "",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**",
        search: "",
      },
      {
        protocol: "https",
        hostname: "www.hostinger.com",
        port: "",
        pathname: "/**",
        search: "",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        port: "",
        pathname: "/**",
      },
    ],
  },

  /**
   * Production security headers applied to every route.
   *
   * These are all "safe" hardening headers that do not interfere with
   * third-party flows (Google OAuth, Cloudinary, Razorpay checkout, GA, or
   * Next's inline runtime scripts).
   *
   * Content-Security-Policy is intentionally NOT enforced here. A strict CSP
   * would need to allowlist (at minimum):
   *   - script-src:  Google (accounts.google.com, apis.google.com),
   *                  Razorpay (checkout.razorpay.com),
   *                  Google Analytics (www.googletagmanager.com,
   *                  www.google-analytics.com), plus 'unsafe-inline'/nonces
   *                  for Next's inline bootstrap scripts.
   *   - frame-src:   accounts.google.com, api.razorpay.com,
   *                  *.razorpay.com (checkout iframe).
   *   - img-src:     res.cloudinary.com, lh3.googleusercontent.com,
   *                  images.unsplash.com, api.dicebear.com, data:, blob:.
   *   - connect-src: Razorpay, Google APIs, and GA collection endpoints.
   * Until that allowlist is verified end-to-end, enabling CSP risks breaking
   * payments/auth, so it is left commented out below.
   */
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
        {
          key: "X-Frame-Options",
          value: "SAMEORIGIN",
        },
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
        {
          key: "X-DNS-Prefetch-Control",
          value: "on",
        },
        // {
        //   key: "Content-Security-Policy",
        //   value:
        //     "default-src 'self'; " +
        //     "script-src 'self' 'unsafe-inline' https://accounts.google.com https://apis.google.com https://checkout.razorpay.com https://www.googletagmanager.com https://www.google-analytics.com; " +
        //     "frame-src 'self' https://accounts.google.com https://api.razorpay.com https://*.razorpay.com; " +
        //     "img-src 'self' data: blob: https://res.cloudinary.com https://lh3.googleusercontent.com https://images.unsplash.com https://api.dicebear.com https://www.hostinger.com; " +
        //     "connect-src 'self' https://*.razorpay.com https://apis.google.com https://www.google-analytics.com; " +
        //     "style-src 'self' 'unsafe-inline';",
        // },
      ],
    },
  ],
};

export default nextConfig;