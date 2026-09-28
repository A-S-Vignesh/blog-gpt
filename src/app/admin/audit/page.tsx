import { FaHistory } from "react-icons/fa";
import { redirect } from "next/navigation";
import { listAdminAuditLog } from "@/lib/data/admin";
import { getAdminActor } from "@/lib/admin/guard";
import AuditTable from "@/components/admin/AuditTable";

export const dynamic = "force-dynamic";

const TARGET_TYPES = ["post", "comment", "user", "message", "campaign"];

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ targetType?: string }>;
}) {
  // Not the security boundary — listAdminAuditLog() enforces that itself. This
  // is here so a non-admin gets a /403 redirect instead of an error boundary.
  if (!(await getAdminActor())) redirect("/403");

  const sp = await searchParams;
  const targetType =
    sp.targetType && TARGET_TYPES.includes(sp.targetType)
      ? sp.targetType
      : undefined;

  const initial = await listAdminAuditLog({ targetType, limit: 50 });

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
          <FaHistory className="text-blue-600" />
          Audit log
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Every action taken from this panel, newest first. Append-only — there
          is no API to edit or clear it, including for you.
        </p>
      </header>

      <AuditTable initial={initial} targetType={targetType} />
    </div>
  );
}
