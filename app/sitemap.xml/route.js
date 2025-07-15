import { getRequest } from "@/utils/requestHandlers";

export async function GET() {
  const baseUrl = "https://thebloggpt.vercel.app";

  // 1. Static routes
  const staticRoutes = [
    "",
    "terms-of-use",
    "privacy-policy",
    "cookies-policy",
      "post/generate",
    "post/create",
  ];

  // 2. Fetch all blog posts with slug
  const posts = await getRequest(`${baseUrl}/api/post?skip=all`);
  const dynamicRoutes = Array.isArray(posts)
    ? posts.map((post) => `post/${post.slug}`)
    : [];

  // 3. Combine all routes
  const allRoutes = [...staticRoutes, ...dynamicRoutes];

  // 4. Build XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes
  .map(
    (route) => `
  <url>
    <loc>${baseUrl}/${route}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`
  )
  .join("")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
