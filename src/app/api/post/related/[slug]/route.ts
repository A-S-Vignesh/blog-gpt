// app/api/post/related/[slug]/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Post from "@/models/Post";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    await connectToDatabase();

    const { slug } = params;

    // 1. Find the current post
    const currentPost = await Post.findOne({ slug });
    if (!currentPost) {
      return NextResponse.json(
        { message: "Post not found", data: [] },
        { status: 404 }
      );
    }

    // 2. If cached relatedPosts exist → return them
    if (currentPost.relatedPosts && currentPost.relatedPosts.length > 0) {
      return NextResponse.json({ data: currentPost.relatedPosts });
    }

    let relatedPosts: any[] = [];
    let usedSlugs = [slug]; // start with current post's slug

    // 3. Related posts by tags
    const tagPosts = await Post.aggregate([
      {
        $match: {
          slug: { $nin: usedSlugs },
          tags: { $in: currentPost.tags },
        },
      },
      {
        $addFields: {
          commonTags: {
            $size: {
              $setIntersection: ["$tags", currentPost.tags],
            },
          },
        },
      },
      { $sort: { commonTags: -1, date: -1 } },
      { $limit: 3 },
      {
        $project: {
          title: 1,
          slug: 1,
          image: 1,
          tags: 1,
          category: 1,
          date: 1,
          excerpt: 1,
        },
      },
    ]);

    relatedPosts = [...relatedPosts, ...tagPosts];
    usedSlugs.push(...tagPosts.map((p) => p.slug));

    // 4. Fallback → same category
    if (relatedPosts.length < 3 && currentPost.category) {
      const categoryPosts = await Post.find({
        slug: { $nin: usedSlugs },
        category: currentPost.category,
      })
        .sort({ date: -1 })
        .limit(3 - relatedPosts.length)
        .select("title slug image tags category date excerpt");

      relatedPosts = [...relatedPosts, ...categoryPosts];
      usedSlugs.push(...categoryPosts.map((p) => p.slug));
    }

    // 5. Fallback → random posts
    if (relatedPosts.length < 3) {
      const randomPosts = await Post.aggregate([
        { $match: { slug: { $nin: usedSlugs } } },
        { $sample: { size: 3 - relatedPosts.length } },
        {
          $project: {
            title: 1,
            slug: 1,
            image: 1,
            tags: 1,
            category: 1,
            date: 1,
            excerpt: 1,
          },
        },
      ]);

      relatedPosts = [...relatedPosts, ...randomPosts];
      usedSlugs.push(...randomPosts.map((p) => p.slug));
    }

    // 6. Save relatedPosts into DB for caching
    currentPost.relatedPosts = relatedPosts;
    await currentPost.save();

    return NextResponse.json({ data: relatedPosts });
  } catch (error) {
    console.error("Error fetching related posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch related posts" },
      { status: 500 }
    );
  }
}
