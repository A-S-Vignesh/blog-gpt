import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import type { Metadata } from "next";
import { FaBell } from "react-icons/fa";
import { authOptions } from "@/lib/authOptions";
import { getUserNotifications } from "@/lib/data/notifications";
import NotificationsClient from "@/components/notifications/NotificationsClient";

// User-specific page, cannot be statically generated.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Notifications | The Blog GPT",
  description: "Comments, replies, likes, and new followers on your account.",
  // Private to the signed-in user, keep it out of search.
  robots: { index: false, follow: false },
};

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?._id) {
    redirect("/auth/signin?callbackUrl=%2Fnotifications");
  }

  // First page rendered server-side so there's no loading flash. Tabs, "Load
  // more", and refreshes go through /api/notifications.
  const initialPage = await getUserNotifications(session.user._id);

  return (
    // Width and padding come from AppShell, same as every other page.
    <div>
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <FaBell className="text-blue-600 dark:text-blue-400" />
          Notifications
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Comments, replies, likes, and new followers. You can choose which
          ones you get in{" "}
          <Link
            href="/settings#notifications"
            className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Settings
          </Link>
          .
        </p>
      </header>

      <NotificationsClient initialPage={initialPage} />
    </div>
  );
}
