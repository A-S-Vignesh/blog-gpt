import ViewPost from "@/components/ViewPost";

// ✅ Dynamic Metadata for Blog Post
export async function generateMetadata({ params }) {
  try {
    const res = await fetch(
      `${process.env.NEXTAUTH_URL}/api/post/${params.slug}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      return {
        title: "Post Not Found | Blog-GPT",
        description: "Sorry, the blog post you're looking for doesn't exist.",
      };
    }

    const post = await res.json();

    const plainContent = post.content?.replace(/<[^>]+>/g, "") || "";
    const shortDescription = plainContent.slice(0, 150).trim();

    const title = `${post.title} | Blog-GPT – AI-Powered Blogging Platform`;

    const tags = post.tag
      ? post.tag
          .split(",")
          .map((tag) => tag.replace(/[#]/g, "").trim())
          .filter(Boolean)
      : [];

    const imageUrl = post.image?.startsWith("http")
      ? post.image
      : `https://thebloggpt.vercel.app${
          post.image || "/assets/images/og-default.jpg"
        }`;

    return {
      title,
      description:
        shortDescription || "Explore AI-generated blogs on Blog-GPT.",
      keywords: [...tags, "AI blog", "Blog-GPT", "AI Web Dev"],
      openGraph: {
        title,
        description: shortDescription,
        url: `https://thebloggpt.vercel.app/post/${params.slug}`,
        siteName: "Blog-GPT",
        type: "article",
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: post.title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description: shortDescription,
        images: [imageUrl],
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  } catch (error) {
    console.error("Metadata generation failed:", error);
    return {
      title: "Post | Blog-GPT",
      description: "Explore the latest AI-powered blog on Blog-GPT.",
    };
  }
}

// ✅ Post View Page
export default async function Page({ params }) {
  const slug = params.slug;

  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/post/${slug}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return <div className="p-10 text-center text-red-500">Post not found</div>;
  }

  const post = await res.json();

  return <ViewPost post={post} />;
}
