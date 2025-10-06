import ViewProfile from "@/components/ViewProfile";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import Post from "@/models/Post";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PopulatedClientPost } from "@/types/post";
import { use } from "react";

// ✅ Type for route params
interface ProfilePageProps {
  params: {
    username: string;
  };
}

// --- SEO & Open Graph Metadata ---
export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/user/${username}`);

  if (!res.ok) {
    return { title: "User Not Found" };
  }

  const user = await res.json();
  const name = user.name || user.username;
  const description = `${
    user.bio || ""
  } - Read more about ${name}'s journey and insights on Blog-GPT.`;
  const image = user.image || "/default-profile.jpg";

  return {
    title: `${name} - TheBlogGPT`,
    description,
    openGraph: {
      title: `${name} - TheBlogGPT`,
      description,
      type: "profile",
      images: [
        {
          url: image,
          width: 800,
          height: 600,
          alt: `${name}'s profile picture`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} - TheBlogGPT`,
      description,
      images: [image],
    },
  };
}

// --- Profile Page ---
export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { username } = await params;

  // 1️⃣ Fetch profile from API (cached until revalidated)
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/user/${username}`);

  if (!res.ok) return notFound();
  const user = await res.json();

  // 2️⃣ Fetch posts directly from DB
  await connectToDatabase();
  const postsFromDB = await Post.find({ creator: user._id })
    .sort({ date: -1 })
    .populate("creator", "name username")
    .lean<PopulatedClientPost[]>();

  const isMyProfile = session?.user?.username === username;
  const posts = JSON.parse(JSON.stringify(postsFromDB));
  const plainUser = JSON.parse(JSON.stringify(user));

  return (
    <ViewProfile data={plainUser} userPosts={posts} isMyProfile={isMyProfile} />
  );
}
