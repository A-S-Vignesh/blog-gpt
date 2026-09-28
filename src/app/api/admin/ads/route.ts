import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api/errors";
import { listAdminCampaigns } from "@/lib/data/adminAds";

export const dynamic = "force-dynamic";

const STATUSES = [
  "draft",
  "pending_review",
  "approved",
  "rejected",
  "active",
  "paused",
  "completed",
  "archived",
];

/** The ad review queue. Authorization lives in listAdminCampaigns(). */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const skip = parseInt(url.searchParams.get("skip") || "0", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);

    const page = await listAdminCampaigns({
      status: status && STATUSES.includes(status) ? status : undefined,
      skip: Number.isFinite(skip) ? skip : 0,
      limit: Number.isFinite(limit) ? limit : 20,
    });

    return NextResponse.json(page);
  } catch (err) {
    return apiErrorResponse(err);
  }
}
