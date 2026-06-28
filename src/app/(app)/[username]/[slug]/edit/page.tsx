import EditPostClient from "@/components/EditPostClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect, notFound } from "next/navigation";
import Post from "@/models/Post";
import { connectToDatabase } from "@/lib/mongodb";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ slug: string; username: string }>;
}) {
  const raw = await params;
  const slug = raw.slug.toLowerCase();

  // Canonicalize only the slug (lowercase); the username keeps its case.
  if (raw.slug !== slug) {
    redirect(`/${raw.username}/${slug}/edit`);
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?._id) {
    redirect(`/auth/signin?callbackUrl=/${raw.username}/${slug}/edit`);
  }

  await connectToDatabase();

  const post = await Post.findOne({ slug })
    .populate<{ creator: { _id: any; username: string } }>(
      "creator",
      "username",
    )
    .select("creator title");

  if (!post) {
    notFound();
  }

  // Verify the post belongs to the username in the URL (case-insensitive) —
  // prevents editing your own post via someone else's username slug.
  if (
    (post.creator as any).username?.toLowerCase() !==
    raw.username.toLowerCase()
  ) {
    notFound();
  }

  // Ownership check — only the author can edit.
  if ((post.creator as any)._id.toString() !== session.user._id) {
    redirect("/403");
  }

  return (
    <EditPostClient
      username={(post.creator as { username: string }).username}
      slug={slug}
    />
  );
}
