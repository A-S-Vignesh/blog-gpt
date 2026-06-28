import { notFound, permanentRedirect } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
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

  const post = (await Post.findOne({ slug })
    .populate("creator", "username")
    .select("slug moderationStatus creator")
    .lean()) as any;

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

  permanentRedirect(`/${username}/${slug}`);
}
