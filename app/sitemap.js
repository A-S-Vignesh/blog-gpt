import { connectToDB } from "@/db/database";
import Post from "@/db/models/post";

export default async function sitemap() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://thebloggpt.vercel.app";
  const deploymentDate = new Date("2025-07-18T00:00:00.000Z");

  let routes = [];

  try {
    await connectToDB();

    // Static routes
    const staticRoutes = [
      {
        url: `${baseUrl}/`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1.0,
      },
      {
        url: `${baseUrl}/terms-of-use`,
        lastModified: deploymentDate,
        changeFrequency: "yearly",
        priority: 0.7,
      },
      {
        url: `${baseUrl}/privacy-policy`,
        lastModified: deploymentDate,
        changeFrequency: "yearly",
        priority: 0.7,
      },
      {
        url: `${baseUrl}/cookies-policy`,
        lastModified: deploymentDate,
        changeFrequency: "yearly",
        priority: 0.7,
      },
      {
        url: `${baseUrl}/post/generate`,
        lastModified: deploymentDate,
        changeFrequency: "monthly",
        priority: 0.6,
      },
      {
        url: `${baseUrl}/post/create`,
        lastModified: deploymentDate,
        changeFrequency: "monthly",
        priority: 0.6,
      },
    ];

    // Dynamic blog post routes
    const posts = await Post.find({}, "slug updatedAt createdAt");
    const dynamicRoutes = posts.map((post) => ({
      url: `${baseUrl}/post/${post.slug}`,
      lastModified: post.updatedAt || post.createdAt || new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    }));

    routes = [...staticRoutes, ...dynamicRoutes];
  } catch (error) {
    console.error("❌ sitemap.js generation error:", error);
  }

  return routes;
}
