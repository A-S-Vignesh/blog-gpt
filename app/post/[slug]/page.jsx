import ViewPost from "@/components/ViewPost";

// ✅ Dynamic SEO Metadata
export async function generateMetadata({ params }) {
  try {
    const res = await fetch(
      `${process.env.NEXTAUTH_URL}/api/post/${params.slug}`,
      {
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return {
        title: "Post Not Found | Blog-GPT",
        description: "Sorry, the blog post you're looking for doesn't exist.",
      };
    }

    const post = await res.json();

    return {
      title: `${post.title} | Blog-GPT`,
      description: post.content.slice(0, 150),
      openGraph: {
        title: post.title,
        description: post.content.slice(0, 150),
        images: [
          {
            url: post.image || "/default.jpg",
            width: 800,
            height: 600,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description: post.content.slice(0, 150),
        images: [post.image || "/default.jpg"],
      },
    };
  } catch (error) {
    return {
      title: "Post | Blog-GPT",
      description: "Explore the latest post on Blog-GPT.",
    };
  }
}

// ✅ Page component
export default async function Page({ params }) {
  const slug = params.slug;

  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/post/${slug}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return <div className="p-10 text-center">Post not found</div>;
  }

  const post = await res.json();

  return <ViewPost post={post} />;
}
