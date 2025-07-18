export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/", // Disallow future admin paths
    },
    sitemap: "https://thebloggpt.vercel.app/sitemap.xml",
  };
}
