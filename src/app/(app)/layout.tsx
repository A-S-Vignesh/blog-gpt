import LeftSidebar from "@/components/feed/LeftSidebar";
import RightSidebar from "@/components/feed/RightSidebar";
import { authOptions } from "@/lib/authOptions";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // If user is not logged in, redirect to landing page
  if (!session) {
    redirect("/auth/signin");
  }
  return (
    <div className="flex w-full max-w-7xl mx-auto py-6 gap-6">
      {/* LEFT SIDEBAR */}
      <div className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto">
          <LeftSidebar user={session.user} />
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-1 min-w-0">{children}</main>

      {/* RIGHT SIDEBAR */}
      <aside className="hidden lg:block w-72 shrink-0">
        <div className="sticky top-24">
          <RightSidebar />
        </div>
      </aside>
    </div>
  );
}
