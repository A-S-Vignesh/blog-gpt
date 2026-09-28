import { FaComments } from "react-icons/fa";
import { redirect } from "next/navigation";
import { listAdminComments } from "@/lib/data/admin";
import { getAdminActor } from "@/lib/admin/guard";
import CommentsTable from "@/components/admin/CommentsTable";

export const dynamic = "force-dynamic";

export default async function AdminCommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  // Not the security boundary — listAdminComments() enforces that itself. This
  // is here so a non-admin gets a /403 redirect instead of an error boundary.
  if (!(await getAdminActor())) redirect("/403");

  const sp = await searchParams;
  const q = sp.q || undefined;

  const initial = await listAdminComments({ q, limit: 25 });

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
          <FaComments className="text-blue-600" />
          Comments
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Every comment across the site, newest first. Deleting a comment also
          removes its replies.
        </p>
      </header>

      <CommentsTable initial={initial} q={q} />
    </div>
  );
}
