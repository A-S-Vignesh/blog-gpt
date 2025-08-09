import { connectToDB } from "@/db/database";
import Post from "@/db/models/post";

const baseUrl = "https://thebloggpt.com";
const deploymentDate = new Date("2025-07-18T00:00:00.000Z");

export default async function sitemap() {
  try {
    await connectToDB();

    const staticRoutes = [
      {
        url: `${baseUrl}/`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 1.0,
      },
      {
        url: `${baseUrl}/about`,
        lastModified: deploymentDate,
        changeFrequency: "yearly",
        priority: 0.8,
      },
      {
        url: `${baseUrl}/contact`,
        lastModified: deploymentDate,
        changeFrequency: "yearly",
        priority: 0.8,
      },
      {
        url: `${baseUrl}/post`,
        lastModified: deploymentDate,
        changeFrequency: "weekly",
        priority: 0.9,
      },
      {
        url: `${baseUrl}/terms-of-use`,
        lastModified: deploymentDate,
        changeFrequency: "yearly",
        priority: 0.3,
      },
      {
        url: `${baseUrl}/privacy-policy`,
        lastModified: deploymentDate,
        changeFrequency: "yearly",
        priority: 0.3,
      },
      {
        url: `${baseUrl}/cookies-policy`,
        lastModified: deploymentDate,
        changeFrequency: "yearly",
        priority: 0.3,
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

    const posts = await Post.find({}, "slug updatedAt createdAt").lean();

    const dynamicRoutes = posts.map((post) => ({
      url: `${baseUrl}/post/${post.slug}`,
      lastModified: new Date(post.updatedAt || post.createdAt || Date.now()),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    return [...staticRoutes, ...dynamicRoutes];
  } catch (error) {
    console.error("❌ Sitemap generation error:", error);
    return [
      {
        url: `${baseUrl}/`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1.0,
      },
    ];
  }
}

// Note: These exports are conflicting - choose one approach
// Option 1: Static generation with revalidation (ISR)
export const revalidate = 86400; // Every 24 hours
