// app/sitemap.js
import { MetadataRoute } from "next"; // Import MetadataRoute for type safety (optional, but good practice)
import { connectToDB } from "@/db/database"; // Your MongoDB connection utility
import Post from "@/db/models/post"; // Your Mongoose Post model

const baseUrl = "https://thebloggpt.vercel.app";
const deploymentDate = new Date("2025-07-18T00:00:00.000Z");

/**
 * Generates the sitemap for the Next.js application.
 * This function is automatically picked up by Next.js in the App Router to create sitemap.xml.
 *
 * @returns {Promise<MetadataRoute.Sitemap>} An array of sitemap entries.
 */
export default async function sitemap() {
  try {
    await connectToDB();
    const staticRoutes = [
      {
        url: `${baseUrl}/`,
        lastModified: new Date().toISOString(), // Use current date for the homepage as it's frequently updated
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
        url: `${baseUrl}/post/generate`, // Assuming this is a static page for generating posts
        lastModified: deploymentDate.toISOString(),
        changeFrequency: "monthly",
        priority: 0.6,
      },
      {
        url: `${baseUrl}/post/create`, // Assuming this is a static page for creating posts
        lastModified: deploymentDate.toISOString(),
        changeFrequency: "monthly",
        priority: 0.6,
      },
    ];
    const posts = await Post.find({}, "slug updatedAt createdAt").lean();
    console.log("📄 Found posts for sitemap:", posts.length);

    
    const dynamicRoutes = posts.map((post) => ({
      url: `${baseUrl}/post/${post.slug}`,
      lastModified: new Date(
        post.updatedAt || post.createdAt || Date.now()
      ).toISOString(),
      changeFrequency: "daily", // Posts might be updated or new ones added daily
      priority: 0.8, // Give dynamic content a good priority
    }));

    // Combine static and dynamic routes into a single array for the sitemap.
    return [...staticRoutes, ...dynamicRoutes];
  } catch (error) {
    // Log any errors that occur during sitemap generation.
    console.error("❌ Sitemap generation error:", error);
    // Return an empty array to prevent the build from failing,
    // though it means the sitemap will be empty if an error occurs.
    return [];
  }
}

// Optional: If you want the sitemap to be regenerated at a specific interval
// (e.g., every hour) even after deployment, you can use Next.js's revalidate option.
// export const revalidate = 3600; // Revalidate the sitemap every 3600 seconds (1 hour)

// Optional: If you are using `output: 'export'` in `next.config.js` for Static Site Generation (SSG),
// you might need to explicitly set `dynamic = 'force-static'` for the sitemap to be generated at build time.
// export const dynamic = 'force-static';
