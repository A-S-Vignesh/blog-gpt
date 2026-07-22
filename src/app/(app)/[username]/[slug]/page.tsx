import ViewPost from "@/components/ViewPost";
import { PopulatedClientPost } from "@/types/post";
import { notFound, redirect, permanentRedirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import {
  getPostBySlug,
  getRelatedPosts,
  getPostComments,
} from "@/lib/data/posts";
import { getUserPostState } from "@/lib/data/userState";
import { slugifyPathSegment } from "@/lib/validation/post";
import { pageTitle, metaDescription, SITE_NAME } from "@/lib/seo";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; username: string }>;
}) {
  const raw = await params;
  // Always look up by canonical (lowercase) form so capitalized URLs still
  // resolve. The page itself redirects to the canonical URL — metadata just
  // needs to return correct OG/title for whichever variant Google crawls.
  const username = raw.username.toLowerCase();
  const slug = raw.slug.toLowerCase();
  try {
    const post = await getPostBySlug(username, slug);

    if (!post) {
      return {
        title: "Post Not Found | The Blog GPT",
        description: "Sorry, the blog post you're looking for doesn't exist.",
      };
    }

    const plainContent = post.content?.replace(/<[^>]+>/g, "") || "";
    const shortDescription = metaDescription(plainContent);
    const tags = post.tags ?? [];
    // Canonical URL uses the creator's stored username case (matches the page).
    const canonicalUsername =
      (post.creator as { username?: string })?.username ?? username;
    const canonicalUrl = `https://thebloggpt.com/${canonicalUsername}/${slug}`;

    return {
      title: pageTitle(post.title),
      description:
        shortDescription || "Explore AI-generated blogs on The Blog GPT.",
      keywords: [...tags, "AI blog", SITE_NAME, "AI Web Dev"].join(", "),
      openGraph: {
        title: post.title,
        description: shortDescription,
        url: canonicalUrl,
        siteName: "The Blog GPT",
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
        canonical: canonicalUrl,
      },
    };
  } catch {
    return {
      title: "Post | The Blog GPT",
      description: "Explore the latest AI-powered blog on The Blog GPT.",
    };
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; username: string }>;
}) {
  const raw = await params;
  const slug = raw.slug.toLowerCase();

  const session = await getServerSession(authOptions);

  // Resolve case-INSENSITIVELY by username (getPostBySlug lowercases internally).
  let [post, relatedPosts] = await Promise.all([
    getPostBySlug(raw.username, slug),
    getRelatedPosts(slug),
  ]);

  // Fallback for pre-migration slugs — see /post/[slug]/page.tsx for the full
  // rationale. Only runs when the exact lookup already missed, so it costs
  // nothing on the normal path; posts created today are slugified at write
  // time and always hit on the first try.
  if (!post) {
    const normalized = slugifyPathSegment(raw.slug);
    if (normalized && normalized !== slug) {
      [post, relatedPosts] = await Promise.all([
        getPostBySlug(raw.username, normalized),
        getRelatedPosts(normalized),
      ]);
    }
  }

  if (!post) notFound();

  // Canonicalize the URL: the post's STORED slug + the creator's current STORED
  // handle. A hit on a RETIRED handle (differs ignoring case) or on a legacy
  // pre-migration slug is a permanent move → 308 for SEO so old links pass their
  // ranking to the new URL; a pure case difference is a soft 307. Either way it
  // resolves in a single hop.
  const creatorUsername =
    (post.creator as { username?: string })?.username ?? raw.username;
  const canonicalSlug = post.slug ?? slug;
  if (raw.username !== creatorUsername || raw.slug !== canonicalSlug) {
    if (
      raw.username.toLowerCase() !== creatorUsername.toLowerCase() ||
      slug !== canonicalSlug
    ) {
      permanentRedirect(`/${creatorUsername}/${canonicalSlug}`);
    }
    redirect(`/${creatorUsername}/${canonicalSlug}`);
  }

  // Comments are fetched OUTSIDE the post's cache so a refresh after posting
  // always shows the current state. User-specific state (liked/bookmarked)
  // also lives outside the cache because it varies per viewer.
  const [{ liked: initialLiked, bookmarked: initialBookmarked }, initialComments] =
    await Promise.all([
      getUserPostState(session?.user?._id ?? null, post._id),
      getPostComments(String(post._id)),
    ]);

  const plainContent = post.content?.replace(/<[^>]+>/g, "") || "";
  const shortDescription = plainContent.slice(0, 150).trim();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            url: `https://thebloggpt.com/${creatorUsername}/${slug}`,
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `https://thebloggpt.com/${creatorUsername}/${slug}`,
            },
            headline: post.title,
            image: [post.image || "https://thebloggpt.com/og-image.jpg"],
            author: {
              "@type": "Person",
              name: post.creator.name,
              url: `https://thebloggpt.com/${post.creator.username}`,
            },
            publisher: {
              "@type": "Organization",
              name: "The Blog GPT",
              logo: {
                "@type": "ImageObject",
                url: "https://thebloggpt.com/web-app-manifest-512x512.png",
              },
            },
            articleBody: plainContent,
            datePublished: new Date(post.date).toISOString(),
            dateModified: new Date(post.updatedAt ?? post.date).toISOString(),
            description: shortDescription,
            keywords: post.tags?.join(", "),
          })
            // Escape so user-controlled title / author name / body can't break
            // out of this inline <script>. The browser parses ld+json as JSON,
            // so neutralizing <, >, & fully prevents a "</script>" breakout/XSS.
            .replace(/</g, "\\u003c")
            .replace(/>/g, "\\u003e")
            .replace(/&/g, "\\u0026")
        }}
      />
      <ViewPost
        post={post as unknown as PopulatedClientPost}
        relatedPosts={relatedPosts as unknown as PopulatedClientPost[]}
        user={session?.user}
        initialLiked={initialLiked}
        initialBookmarked={initialBookmarked}
        initialComments={initialComments as any}
      />
    </>
  );
}
