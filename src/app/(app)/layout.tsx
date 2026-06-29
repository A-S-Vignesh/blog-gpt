import AppShell from "@/components/feed/AppShell";
import { authOptions } from "@/lib/authOptions";
import { getServerSession } from "next-auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get session but don't redirect — public pages are allowed through.
  // Individual protected pages (/feed, /explore) do their own redirect.
  const session = await getServerSession(authOptions);

  return <AppShell user={session?.user ?? null}>{children}</AppShell>;
}
