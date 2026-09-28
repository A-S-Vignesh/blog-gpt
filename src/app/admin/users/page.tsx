import { FaUsers } from "react-icons/fa";
import { listAdminUsers } from "@/lib/data/admin";
import UsersTable from "@/components/admin/UsersTable";
import { getAdminActor } from "@/lib/admin/guard";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Search = { q?: string; role?: string; plan?: string; state?: string };

function asRole(v?: string): "admin" | "author" | "user" | undefined {
  return v === "admin" || v === "author" || v === "user" ? v : undefined;
}
function asPlan(v?: string): "free" | "pro" | "business" | undefined {
  return v === "free" || v === "pro" || v === "business" ? v : undefined;
}
function asState(v?: string): "banned" | "deleting" | undefined {
  return v === "banned" || v === "deleting" ? v : undefined;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  // The layout already gated this, but the page needs the actor's own id so the
  // table can mark "you" and hide the self-destructive controls.
  const actor = await getAdminActor();
  if (!actor) redirect("/403");

  const sp = await searchParams;
  const filter = {
    q: sp.q || undefined,
    role: asRole(sp.role),
    plan: asPlan(sp.plan),
    state: asState(sp.state),
  };

  const initial = await listAdminUsers({ ...filter, limit: 25 });

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
          <FaUsers className="text-blue-600" />
          Users
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Ban accounts, change roles, and override plans or AI credits. Every
          change is written to the audit log with your name on it.
        </p>
      </header>

      <UsersTable initial={initial} filter={filter} actorId={actor.id} />
    </div>
  );
}
