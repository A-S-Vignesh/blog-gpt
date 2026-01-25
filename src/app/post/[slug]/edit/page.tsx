import EditPostClient from "@/components/EditPostClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import Post from "@/models/Post"; // adjust path if needed
import { connectToDatabase } from "@/lib/mongodb"; // adjust your DB import


export default async function EditPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  await connectToDatabase();

  // Fetch the post
  const post = await Post.findOne({ slug }).select("creator title");

  if (!post) {
    redirect("/404");
  }

  // Check if this user owns the post
  if (post.creator.toString() !== session.user._id) {
    redirect("/403"); // or home → redirect("/")
  }

  return <EditPostClient slug={slug} />;
}
