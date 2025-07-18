import { connectToDB } from "@/db/database";
import Post from "@/db/models/post";

export async function GET() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://thebloggpt.vercel.app";
  const deploymentDate = new Date("2025-07-18T00:00:00.000Z").toISOString();

  let allRoutes = [];

  try {
    await connectToDB();

    // Static routes
    const staticRoutes = [
      {
        path: "",
        lastmod: new Date().toISOString(),
        changefreq: "daily",
        priority: 1.0,
      },
      {
        path: "terms-of-use",
        lastmod: deploymentDate,
        changefreq: "yearly",
        priority: 0.7,
      },
      {
        path: "privacy-policy",
        lastmod: deploymentDate,
        changefreq: "yearly",
        priority: 0.7,
      },
      {
        path: "cookies-policy",
        lastmod: deploymentDate,
        changefreq: "yearly",
        priority: 0.7,
      },
      {
        path: "post/generate",
        lastmod: deploymentDate,
        changefreq: "monthly",
        priority: 0.6,
      },
      {
        path: "post/create",
        lastmod: deploymentDate,
        changefreq: "monthly",
        priority: 0.6,
      },
    ];

    // Dynamic post routes
    const posts = await Post.find({}, "slug updatedAt createdAt");
    const dynamicRoutes = posts.map((post) => ({
      path: `post/${post.slug}`,
      lastmod: (post.updatedAt || post.createdAt || new Date()).toISOString(),
      changefreq: "daily",
      priority: 0.8,
    }));

    allRoutes = [...staticRoutes, ...dynamicRoutes];
  } catch (error) {
    console.error("❌ Sitemap generation error:", error);
    allRoutes = []; // fallback to empty sitemap
  }

  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes
  .map(
    ({ path, lastmod, changefreq = "weekly", priority = 0.5 }) => `
  <url>
    <loc>${baseUrl}/${path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
  )
  .join("")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
    },
  });
}
