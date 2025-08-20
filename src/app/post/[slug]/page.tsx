import PostNotFound from "@/components/PostNotFound";
import ViewPost from "@/components/ViewPost";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/post/${slug}`);

    if (!res.ok) {
      return {
        title: "Post Not Found | Blog-GPT",
        description: "Sorry, the blog post you're looking for doesn't exist.",
      };
    }

    const post = await res.json();
    const plainContent = post.content?.replace(/<[^>]+>/g, "") || "";
    const shortDescription = plainContent.slice(0, 150).trim();
    const tags = post.tags;

    return {
      title: `${post.title} | Blog-GPT`,
      description:
        shortDescription || "Explore AI-generated blogs on Blog-GPT.",
      keywords: [...tags, "AI blog", "Blog-GPT", "AI Web Dev"],
      openGraph: {
        title: post.title,
        description: shortDescription,
        url: `https://thebloggpt.com/post/${slug}`,
        siteName: "Blog-GPT",
        type: "article",
        images: [
          {
            url: post.image || "https://thebloggpt.com/og-default.jpg",
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
        images: [post.image || "https://thebloggpt.com/og-default.jpg"],
      },
      robots: { index: true, follow: true },
      alternates: {
        canonical: `https://thebloggpt.com/post/${slug}`,
      },
    };
  } catch {
    return {
      title: "Post | Blog-GPT",
      description: "Explore the latest AI-powered blog on Blog-GPT.",
    };
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/post/${slug}`);

  if (!res.ok) return <PostNotFound />;

  const post = await res.json();
  return <ViewPost post={post} />;
}
