import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { apiErrorResponse } from "@/lib/api/errors";
import { listAdminUsers } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

/**
 * Paginated user directory.
 *
 * Every query parameter is narrowed to a fixed allowlist before it reaches the
 * data layer. That is not stylistic: `searchParams.get()` returns a string, but
 * passing it through unchecked would let `?role[$ne]=admin`-style input become
 * a query operator if the parsing ever changed. Comparing against literal
 * unions makes that impossible by construction.
 */
export async function GET(req: Request) {
  try {
    await requireAdmin();

    const url = new URL(req.url);
    const role = url.searchParams.get("role");
    const plan = url.searchParams.get("plan");
    const state = url.searchParams.get("state");
    const q = url.searchParams.get("q") || undefined;
    const skip = parseInt(url.searchParams.get("skip") || "0", 10);
    const limit = parseInt(url.searchParams.get("limit") || "25", 10);

    const page = await listAdminUsers({
      role:
        role === "admin" || role === "author" || role === "user"
          ? role
          : undefined,
      plan:
        plan === "free" || plan === "pro" || plan === "business"
          ? plan
          : undefined,
      state: state === "banned" || state === "deleting" ? state : undefined,
      q,
      skip: Number.isFinite(skip) ? skip : 0,
      limit: Number.isFinite(limit) ? limit : 25,
    });

    return NextResponse.json(page);
  } catch (err) {
    return apiErrorResponse(err);
  }
}
