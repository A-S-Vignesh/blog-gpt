import { FaEnvelope } from "react-icons/fa";
import { redirect } from "next/navigation";
import { listAdminMessages } from "@/lib/data/admin";
import { getAdminActor } from "@/lib/admin/guard";
import MessagesInbox from "@/components/admin/MessagesInbox";

export const dynamic = "force-dynamic";

function asStatus(v?: string): "new" | "read" | "replied" | undefined {
  return v === "new" || v === "read" || v === "replied" ? v : undefined;
}

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  // Not the security boundary — listAdminMessages() enforces that itself. This
  // is here so a non-admin gets a /403 redirect instead of an error boundary.
  if (!(await getAdminActor())) redirect("/403");

  const sp = await searchParams;
  const status = asStatus(sp.status);

  const initial = await listAdminMessages({ status, limit: 25 });

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6">
        <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
          <FaEnvelope className="text-blue-600" />
          Messages
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Everything submitted through the contact form. Until now these were
          written to the database and never read anywhere.
        </p>
      </header>

      <MessagesInbox initial={initial} status={status} />
    </div>
  );
}
