import { FaFileAlt } from "react-icons/fa";
import { redirect } from "next/navigation";
import { listAdminPosts } from "@/lib/data/admin";
import { getAdminActor } from "@/lib/admin/guard";
import PostsTable from "@/components/admin/PostsTable";

export const dynamic = "force-dynamic";

type Search = {
  moderationStatus?: string;
  status?: string;
  q?: string;
};

// Narrow the raw query string to the union the data layer accepts, so a
// hand-typed `?status=nonsense` is ignored instead of reaching the query.
function asModeration(v?: string): "pending" | "approved" | "flagged" | undefined {
  return v === "pending" || v === "approved" || v === "flagged" ? v : undefined;
}
function asStatus(v?: string): "draft" | "published" | "archived" | undefined {
  return v === "draft" || v === "published" || v === "archived" ? v : undefined;
}

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  // Not the security boundary — listAdminPosts() enforces that itself. This is
  // here so a non-admin gets a /403 redirect instead of an error boundary.
  if (!(await getAdminActor())) redirect("/403");

  const sp = await searchParams;
  const filter = {
    moderationStatus: asModeration(sp.moderationStatus),
    status: asStatus(sp.status),
    q: sp.q || undefined,
  };

  // First page server-rendered so the queue is on screen immediately; the
  // table fetches subsequent pages itself.
  const initial = await listAdminPosts({ ...filter, limit: 25 });

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
          <FaFileAlt className="text-blue-600" />
          Posts
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Review what AI moderation flagged, unpublish anything that
          shouldn&apos;t be live, and delete what has to go. Deleting also
          removes the post&apos;s comments, likes, bookmarks, and views.
        </p>
      </header>

      <PostsTable initial={initial} filter={filter} />
    </div>
  );
}
