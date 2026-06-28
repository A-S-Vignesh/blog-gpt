import { notFound, permanentRedirect } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import Post from "@/models/Post";
import "@/models/User";

// Legacy redirect: /post/{slug}/edit  →  /{username}/{slug}/edit
// Edit pages typically aren't indexed (they're auth-gated), but users may
// still have bookmarks or browser history pointing here. A 308 keeps those
// working without exposing them to a generic 404.
export const dynamic = "force-dynamic";

export default async function LegacyPostEditRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  const slug = rawSlug.toLowerCase();

  await connectToDatabase();

  const post = (await Post.findOne({ slug })
    .populate("creator", "username")
    .select("slug creator")
    .lean()) as any;

  if (!post) {
    notFound();
  }

  const username = post.creator?.username?.toLowerCase();
  if (!username) {
    notFound();
  }

  permanentRedirect(`/${username}/${slug}/edit`);
}
