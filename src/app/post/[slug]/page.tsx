import { notFound, permanentRedirect } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import { slugifyPathSegment } from "@/lib/validation/post";
import Post from "@/models/Post";
import "@/models/User";

// Legacy redirect:  /post/{slug}  →  /{username}/{slug}
//
// Google has indexed the old URLs from when posts lived at /post/{slug}.
// We resolve the post, look up its author, and emit a 308 permanent redirect
// so the new canonical URL inherits the SEO value (308 passes full ranking
// signal to the target). Posts that no longer exist (or are moderation-flagged)
// return a real 404 — that tells Google to drop them, which is what we want
// for dead URLs.
export const dynamic = "force-dynamic";

export default async function LegacyPostRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  const slug = rawSlug.toLowerCase();

  await connectToDatabase();

  const findBySlug = (value: string) =>
    Post.findOne({ slug: value })
      .populate("creator", "username")
      .select("slug moderationStatus creator")
      .lean() as Promise<any>;

  let post = await findBySlug(slug);

  // Fallback for pre-migration slugs. Posts used to store raw, unnormalized
  // slugs ("hotel room booking, hotel room booking in chennai"); the slug
  // migration rewrote them to the canonical hyphenated form. Google still has
  // the old spelling indexed, so an exact match misses and the URL 404s —
  // dropping a page that already has ranking. Re-slugifying the request
  // recovers the match and lets the 308 below hand its equity to the new URL.
  if (!post) {
    const normalized = slugifyPathSegment(rawSlug);
    if (normalized && normalized !== slug) {
      post = await findBySlug(normalized);
    }
  }

  if (!post || post.moderationStatus === "flagged") {
    notFound();
  }

  // Redirect straight to the canonical URL: the creator's STORED username case
  // (e.g. /Vignesh-Devil) + the lowercase slug. Using the stored case avoids a
  // second hop — the post page canonicalizes mixed-case usernames, so lowercasing
  // here would create a /post/slug → /vignesh-devil/slug → /Vignesh-Devil/slug
  // redirect chain and bleed link equity.
  const username = post.creator?.username;
  if (!username) {
    notFound();
  }

  // Redirect to the STORED slug, not the requested one — on the fallback path
  // above they differ, and sending the old spelling would just bounce into
  // another redirect.
  permanentRedirect(`/${username}/${post.slug}`);
}
