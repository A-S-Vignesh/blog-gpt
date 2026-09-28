import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { apiErrorResponse } from "@/lib/api/errors";
import { listAdminComments } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

/** Paginated, searchable comment list across every post. */
export async function GET(req: Request) {
  try {
    await requireAdmin();

    const url = new URL(req.url);
    const q = url.searchParams.get("q") || undefined;
    const skip = parseInt(url.searchParams.get("skip") || "0", 10);
    const limit = parseInt(url.searchParams.get("limit") || "25", 10);

    const page = await listAdminComments({
      q,
      skip: Number.isFinite(skip) ? skip : 0,
      limit: Number.isFinite(limit) ? limit : 25,
    });

    return NextResponse.json(page);
  } catch (err) {
    return apiErrorResponse(err);
  }
}
