import ViewProfile from "@/components/ViewProfile";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDB } from "@/db/database";
import Post from "@/db/models/post";
import { notFound } from "next/navigation";

// --- SEO & Open Graph Metadata ---
export async function generateMetadata({ params }) {
  const res = await fetch(
    `${process.env.NEXTAUTH_URL}/api/user/${params.username}`
    // ✅ No "no-store" — will use default ISR caching
  );

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
    title: `${name} - Blog-GPT`,
    description,
    openGraph: {
      title: `${name} - Blog-GPT`,
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
      title: `${name} - Blog-GPT`,
      description,
      images: [image],
    },
  };
}

// --- Profile Page ---
export default async function ProfilePage({ params }) {
  const session = await getServerSession(authOptions);

  // 1️⃣ Fetch profile from API (cached until revalidated)
  const res = await fetch(
    `${process.env.NEXTAUTH_URL}/api/user/${params.username}`
  );

  if (!res.ok) return notFound();
  const user = await res.json();

  // 2️⃣ Fetch posts directly from DB
  await connectToDB();
  const posts = await Post.find({ creator: user._id })
    .populate("creator", "name username")
    .lean();

  const isMyProfile = session?.user?.username === params.username;

  return (
    <ViewProfile data={user} userPosts={posts} isMyProfile={isMyProfile} />
  );
}
