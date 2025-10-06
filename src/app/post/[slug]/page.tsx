import PostNotFound from "@/components/PostNotFound";
import ViewPost from "@/components/ViewPost";
import { PopulatedClientPost } from "@/types/post";
import { url } from "inspector";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/post/${slug}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return {
        title: "Post Not Found | TheBlogGPT",
        description: "Sorry, the blog post you're looking for doesn't exist.",
      };
    }

    const post = await res.json();
    const plainContent = post.content?.replace(/<[^>]+>/g, "") || "";
    const shortDescription = plainContent.slice(0, 150).trim();
    const tags = post.tags;

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
          author: post.author.name,
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
  } catch {
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

  // fetch main post
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/post/${slug}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return <PostNotFound />;
  const post: PopulatedClientPost = await res.json();

  // fetch related posts
  const relatedRes = await fetch(
    `${process.env.NEXTAUTH_URL}/api/post/related/${slug}`,
    {
      next: { revalidate: 60 },
    }
  );
  const relatedData = relatedRes.ok ? await relatedRes.json() : { data: [] };
  const plainContent = post.content?.replace(/<[^>]+>/g, "") || "";
  const shortDescription = plainContent.slice(0, 150).trim();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            url: `https://thebloggpt.com/post/${post.slug}`,
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `https://thebloggpt.com/post/${post.slug}`,
            },
            headline: post.title,
            image: [post.image || "https://thebloggpt.com/og-image.jpg"],
            author: { "@type": "Person", name: post.creator.username },
            publisher: {
              "@type": "Organization",
              name: "TheBlogGPT",
              logo: {
                "@type": "ImageObject",
                url: "https://thebloggpt.com/web-app-manifest-512x512.png",
              },
            },
            articleBody: plainContent,
            datePublished: new Date(post.date).toISOString(),
            dateModified: new Date(
              post.updatedAt ?? post.date ?? Date.now()
            ).toISOString(),
            description: shortDescription,
            keywords: post.tags?.join(", "),
          }),
        }}
      />
      <ViewPost post={post} relatedPosts={relatedData.data} />
    </>
  );
}
