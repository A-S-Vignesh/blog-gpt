export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/", // Disallow future admin paths
    },
    sitemap: "https://thebloggpt.com/sitemap.xml",
  };
}
