import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep API and private/auth-gated surfaces out of the index (belt-and-
      // suspenders on top of auth redirects + per-page noindex).
      disallow: [
        "/api/",
        "/settings",
        "/billing",
        "/bookmarks",
        "/feed",
        "/post/create",
        "/post/generate",
      ],
    },
    sitemap: "https://thebloggpt.com/sitemap.xml",
  };
}
