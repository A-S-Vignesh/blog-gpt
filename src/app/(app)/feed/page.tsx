import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import FeedHomepage from "@/components/feed/FeedHomePage";
import { redirect } from "next/navigation";

export default async function FeedPage() {
  const session = await getServerSession(authOptions);

  // If user is not logged in, redirect to landing page
  if (!session) {
    redirect("/auth/signin");
  }

  const user = session.user;

  return <FeedHomepage user={user} />;
}
