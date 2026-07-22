import type { NextConfig } from "next";

/**
 * Content-Security-Policy sent on every route. See the note above `headers`
 * below for why each source list looks the way it does.
 */
const CSP = [
  "default-src 'self'",
  // 'unsafe-inline' is required by Next's inline bootstrap/flight scripts.
  // Razorpay = checkout.js; googletagmanager/google-analytics = GA;
  // va.vercel-scripts = Vercel Analytics; cloudflareinsights + the Cloudflare
  // email-protection script are injected by the CDN in front of this app.
  "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://www.googletagmanager.com https://www.google-analytics.com https://va.vercel-scripts.com https://static.cloudflareinsights.com",
  // Tailwind emits a stylesheet, but next/image and inline style props still
  // need 'unsafe-inline' for element-level styles.
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  // Mirrors images.remotePatterns above; data:/blob: cover the editor's local
  // previews before an upload completes.
  "img-src 'self' data: blob: https://res.cloudinary.com https://lh3.googleusercontent.com https://images.unsplash.com https://api.dicebear.com https://www.hostinger.com https://www.google-analytics.com https://www.googletagmanager.com",
  // Razorpay renders checkout in an iframe; Google OAuth is a top-level
  // redirect but accounts.google.com is allowed in case it falls back to one.
  "frame-src 'self' https://api.razorpay.com https://*.razorpay.com https://accounts.google.com",
  "connect-src 'self' https://*.razorpay.com https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com https://vitals.vercel-insights.com https://cloudflareinsights.com",
  // Razorpay posts the payment result back to its own domain.
  "form-action 'self' https://api.razorpay.com https://*.razorpay.com",
  // The three that do the real work: no plugins, no <base> hijacking, no
  // framing by third parties (the modern replacement for X-Frame-Options).
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
  "upgrade-insecure-requests",
].join("; ");

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
   * Content-Security-Policy is enforced below. The allowlist was derived from
   * the origins this app actually loads, not from guesswork:
   *   - Razorpay checkout script + iframe (src/components/payments/CheckoutButton.tsx)
   *   - Google Analytics + Vercel Analytics, both consent-gated
   *     (src/components/AnalyticsLoader.tsx)
   *   - Cloudflare's injected email-protection/beacon scripts (the site is
   *     proxied through Cloudflare)
   *   - every remote image host declared in `images.remotePatterns` above
   *
   * script-src keeps 'unsafe-inline' deliberately. Next streams ~150 inline
   * bootstrap/flight scripts per page; the nonce alternative requires computing
   * a per-request nonce in middleware, which forces every route to render
   * dynamically and gives up ISR/static caching. That is a real performance
   * regression in exchange for a marginal XSS win here, since all user-authored
   * HTML is already stripped of scripts and event handlers server-side by
   * sanitize-html (src/utils/sanitizeHtmlForRender.ts) before it is rendered.
   *
   * object-src/base-uri/frame-ancestors are the parts that carry actual weight:
   * they block plugin embeds, <base> tag hijacking, and clickjacking.
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
        // Production only: in dev, Turbopack's HMR websocket and eval-based
        // module runtime don't fit this policy, and tightening it there would
        // cost developer experience without protecting any real user.
        ...(process.env.NODE_ENV === "production"
          ? [{ key: "Content-Security-Policy", value: CSP }]
          : []),
      ],
    },
  ],
};

export default nextConfig;