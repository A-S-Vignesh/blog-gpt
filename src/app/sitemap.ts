import { connectToDatabase } from "@/lib/mongodb";
import Post from "@/models/Post";
import "@/models/User";

const baseUrl = "https://thebloggpt.com";
const deploymentDate = new Date("2025-07-18T00:00:00.000Z");

export default async function sitemap(){
  try {
    await connectToDatabase();

    const staticRoutes = [
      {
        url: `${baseUrl}/`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 1.0,
      },
      {
        url: `${baseUrl}/pricing`,
        lastModified: deploymentDate,
        changeFrequency: "yearly",
        priority: 0.9,
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
        url: `${baseUrl}/explore`,
        lastModified: new Date(),
        changeFrequency: "daily",
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
      // Note: /post/generate and /post/create are intentionally excluded.
      // They are auth-gated workspace routes — letting Google index them
      // produces "Soft 404" warnings and confuses crawlers.
    ];

    // Skip flagged content from the sitemap so Google never indexes it.
    // Populate the creator's username so each post URL matches the canonical
    // /{username}/{slug} route (the same URL the post pages render at).
    const posts = await Post.find(
      { moderationStatus: { $ne: "flagged" } },
      "slug updatedAt createdAt creator",
    )
      .populate<{ creator: { username?: string } }>("creator", "username")
      .lean();

    const dynamicRoutes = posts
      .filter((post: any) => post.creator?.username && post.slug)
      .map((post: any) => ({
        url: `${baseUrl}/${post.creator.username}/${post.slug}`,
        lastModified: new Date(
          post.updatedAt || post.createdAt || Date.now(),
        ),
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
