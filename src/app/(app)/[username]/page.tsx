import ViewProfile from "@/components/ViewProfile";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { notFound, redirect, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { getUserFollowState } from "@/lib/data/userState";
import {
  getProfileByUsername,
  getUserPostsByUserId,
  getUserPostsCount,
} from "@/lib/data/users";

// --- SEO & Open Graph Metadata ---
export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  // Shares one DB query with the page below via React cache() — no HTTP hop.
  const user = (await getProfileByUsername(username)) as any;

  if (!user) {
    return { title: "User Not Found" };
  }

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
  const raw = await params;

  // Resolve the user (direct DB query, case-insensitive) and the session in
  // parallel. getProfileByUsername is deduped with generateMetadata above.
  const [session, user] = await Promise.all([
    getServerSession(authOptions),
    getProfileByUsername(raw.username) as Promise<any>,
  ]);

  if (!user) return notFound();

  // Canonicalize the URL to the user's current STORED handle (e.g. /Vignesh-Devil).
  // A hit on a RETIRED handle (differs ignoring case) is a permanent move, so we
  // 308 for SEO; a pure case difference of the current handle is a soft 307.
  // Either way it resolves in a single hop. No loop once the URL matches.
  if (raw.username !== user.username) {
    if (raw.username.toLowerCase() !== user.username.toLowerCase()) {
      permanentRedirect(`/${user.username}`);
    }
    redirect(`/${user.username}`);
  }

  // Posts, the total post count, and the viewer's follow state are independent.
  const [posts, postsCount, followState] = await Promise.all([
    getUserPostsByUserId(user._id),
    getUserPostsCount(user._id),
    getUserFollowState(session?.user?._id ?? null, user._id),
  ]);

  const isMyProfile =
    session?.user?.username?.toLowerCase() === user.username?.toLowerCase();

  // Deep-clone for the client component. Email is never selected, so it is
  // never present here or sent to the browser.
  const plainUser = JSON.parse(JSON.stringify(user));
  const plainPosts = JSON.parse(JSON.stringify(posts));

  return (
    <ViewProfile
      data={plainUser}
      userPosts={plainPosts}
      isMyProfile={isMyProfile}
      postsCount={postsCount}
      username={user.username}
      initialFollowing={followState.following}
    />
  );
}
