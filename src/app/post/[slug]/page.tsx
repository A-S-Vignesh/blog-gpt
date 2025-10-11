import PostNotFound from "@/components/PostNotFound";
import ViewPost from "@/components/ViewPost";
import { PopulatedClientPost } from "@/types/post";
import { connectToDatabase } from "@/lib/mongodb";
import Post from "@/models/Post";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    await connectToDatabase();

    // Fetch the post directly from DB
    const post: PopulatedClientPost | null = await Post.findOne({ slug })
      .populate("creator", "name username")
      .lean<PopulatedClientPost>();

    if (!post) {
      return {
        title: "Post Not Found | TheBlogGPT",
        description: "Sorry, the blog post you're looking for doesn't exist.",
      };
    }

    const plainContent = post.content?.replace(/<[^>]+>/g, "") || "";
    const shortDescription = plainContent.slice(0, 150).trim();
    const tags = post.tags || [];

    return {
      title: `${post.title} | TheBlogGPT`,
      description:
        shortDescription || "Explore AI-generated blogs on TheBlogGPT.",
      keywords: [
        ...tags,
        "AI blog",
        "Blog-GPT",
        "TheBlogGPT",
        "BlogGPT",
        "AI Web Dev",
      ].join(", "),
      openGraph: {
        title: post.title,
        description: shortDescription,
        url: `https://thebloggpt.com/post/${slug}`,
        siteName: "TheBlogGPT",
        type: "article",
        article: {
          author: post.creator.name,
          tags: post.tags,
        },
        images: [
          {
            url: post.image || "https://thebloggpt.com/og-image.jpg",
            width: 1200,
            height: 630,
            alt: post.title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description: shortDescription,
        images: [post.image || "https://thebloggpt.com/og-image.jpg"],
      },
      robots: { index: true, follow: true },
      alternates: {
        canonical: `https://thebloggpt.com/post/${slug}`,
      },
    };
  } catch (err) {
    console.error("Error generating metadata:", err);
    return {
      title: "Post | TheBlogGPT",
      description: "Explore the latest AI-powered blog on TheBlogGPT.",
    };
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  await connectToDatabase();

  // Fetch the main post directly from DB
  const post: PopulatedClientPost | null = await Post.findOne({ slug })
    .populate("creator", "name username")
    .lean<PopulatedClientPost>();

  if (!post) return <PostNotFound />;

  // Convert to plain object to avoid React Client Component errors
  const plainPost: PopulatedClientPost = {
    ...post,
    _id: post._id.toString(),
    creator: {
      ...post.creator,
      _id: post.creator?._id ? post.creator._id.toString() : "",
    },
  };


  // Fetch related posts via API (typed)
  const relatedRes = await fetch(
    `${process.env.NEXTAUTH_URL}/api/post/related/${slug}`,
    {
      next: { revalidate: 60 },
    }
  );
  const relatedData: { data: PopulatedClientPost[] } = relatedRes.ok
    ? await relatedRes.json()
    : { data: [] };

  const plainContent = plainPost.content?.replace(/<[^>]+>/g, "") || "";
  const shortDescription = plainContent.slice(0, 150).trim();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            url: `https://thebloggpt.com/post/${plainPost.slug}`,
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `https://thebloggpt.com/post/${plainPost.slug}`,
            },
            headline: plainPost.title,
            image: [plainPost.image || "https://thebloggpt.com/og-image.jpg"],
            author: {
              "@type": "Person",
              name: plainPost.creator.name,
              url: `https://thebloggpt.com/profile/${plainPost.creator.username}`,
            },
            publisher: {
              "@type": "Organization",
              name: "TheBlogGPT",
              logo: {
                "@type": "ImageObject",
                url: "https://thebloggpt.com/web-app-manifest-512x512.png",
              },
            },
            articleBody: plainContent,
            datePublished: new Date(plainPost.date).toISOString(),
            dateModified: new Date(
              plainPost.updatedAt ?? plainPost.date ?? Date.now()
            ).toISOString(),
            description: shortDescription,
            keywords: plainPost.tags?.join(", "),
          }),
        }}
      />
      <ViewPost post={plainPost} relatedPosts={relatedData.data} />
    </>
  );
}
