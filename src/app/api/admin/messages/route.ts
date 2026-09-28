import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { apiErrorResponse } from "@/lib/api/errors";
import { listAdminMessages } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

/** Paginated contact-form inbox, optionally filtered by status. */
export async function GET(req: Request) {
  try {
    await requireAdmin();

    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const skip = parseInt(url.searchParams.get("skip") || "0", 10);
    const limit = parseInt(url.searchParams.get("limit") || "25", 10);

    const page = await listAdminMessages({
      status:
        status === "new" || status === "read" || status === "replied"
          ? status
          : undefined,
      skip: Number.isFinite(skip) ? skip : 0,
      limit: Number.isFinite(limit) ? limit : 25,
    });

    return NextResponse.json(page);
  } catch (err) {
    return apiErrorResponse(err);
  }
}
