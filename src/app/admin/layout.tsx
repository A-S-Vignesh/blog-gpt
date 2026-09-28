import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getAdminActor } from "@/lib/admin/guard";
import { getAdminBadges } from "@/lib/data/admin";
import AdminShell from "@/components/admin/AdminShell";

// Admin data is per-request and must never be cached or prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin | The Blog GPT",
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Server-side gate for every /admin page.
 *
 * proxy.ts has already bounced signed-OUT visitors to the sign-in page, but it
 * deliberately leaves the role check to us (see the note there): it can only
 * read a JWT claim that lags the database by up to five minutes. This reads
 * the role from MongoDB, so both a promotion and a demotion take effect on the
 * very next navigation. The API routes repeat the check independently —
 * nothing here is trusted by them.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await getAdminActor();
  if (!actor) {
    redirect("/403");
  }

  const badges = await getAdminBadges();

  return (
    <AdminShell adminName={actor.email} badges={badges}>
      {children}
    </AdminShell>
  );
}
