import { MetadataRoute } from "next"; // Optional for type safety
import { connectToDB } from "@/db/database";
import Post from "@/db/models/post";

const baseUrl = "https://thebloggpt.vercel.app";
const deploymentDate = new Date("2025-07-18T00:00:00.000Z");

export default async function sitemap() {
  try {
    await connectToDB();

    const staticRoutes = [
      {
        url: `${baseUrl}/`,
        lastModified: new Date().toISOString(),
        changeFrequency: "daily",
        priority: 1.0,
      },
      {
        url: `${baseUrl}/terms-of-use`,
        lastModified: deploymentDate.toISOString(),
        changeFrequency: "yearly",
        priority: 0.7,
      },
      {
        url: `${baseUrl}/privacy-policy`,
        lastModified: deploymentDate.toISOString(),
        changeFrequency: "yearly",
        priority: 0.7,
      },
      {
        url: `${baseUrl}/cookies-policy`,
        lastModified: deploymentDate.toISOString(),
        changeFrequency: "yearly",
        priority: 0.7,
      },
      {
        url: `${baseUrl}/post/generate`,
        lastModified: deploymentDate.toISOString(),
        changeFrequency: "monthly",
        priority: 0.6,
      },
      {
        url: `${baseUrl}/post/create`,
        lastModified: deploymentDate.toISOString(),
        changeFrequency: "monthly",
        priority: 0.6,
      },
    ];

    const posts = await Post.find({}, "slug updatedAt createdAt").lean();

    const dynamicRoutes = posts.map((post) => ({
      url: `${baseUrl}/post/${post.slug}`,
      lastModified: new Date(
        post.updatedAt || post.createdAt || Date.now()
      ).toISOString(),
      changeFrequency: "daily",
      priority: 0.8,
    }));

    return [...staticRoutes, ...dynamicRoutes];
  } catch (error) {
    console.error("❌ Sitemap generation error:", error);
    return [];
  }
}

// ✅ These are the important additions for correct sitemap behavior on Vercel:
export const revalidate = 86400; // Regenerate sitemap every hour
export const dynamic = "force-static"; // Ensure sitemap is treated as static
