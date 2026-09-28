import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { apiErrorResponse } from "@/lib/api/errors";
import { listAdminAuditLog } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

const ACTIONS = [
  "post.approve",
  "post.flag",
  "post.unpublish",
  "post.delete",
  "comment.delete",
  "message.status",
  "message.delete",
  "user.ban",
  "user.unban",
  "user.role",
  "user.plan",
  "user.credits",
  "ad.approve",
  "ad.reject",
  "ad.pause",
  "ad.resume",
  "ad.mark_paid",
  "ad.refund",
];
const TARGET_TYPES = ["post", "comment", "user", "message", "campaign"];

/**
 * Read the admin audit log.
 *
 * Read-only by design: there is no POST, PATCH, or DELETE here and no other
 * route writes to this collection except logAdminAction(). An audit trail an
 * admin can edit or clear is not an audit trail, so the ability simply does
 * not exist in the API surface.
 */
export async function GET(req: Request) {
  try {
    await requireAdmin();

    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const targetType = url.searchParams.get("targetType");
    const skip = parseInt(url.searchParams.get("skip") || "0", 10);
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);

    const page = await listAdminAuditLog({
      action: action && ACTIONS.includes(action) ? action : undefined,
      targetType:
        targetType && TARGET_TYPES.includes(targetType) ? targetType : undefined,
      skip: Number.isFinite(skip) ? skip : 0,
      limit: Number.isFinite(limit) ? limit : 50,
    });

    return NextResponse.json(page);
  } catch (err) {
    return apiErrorResponse(err);
  }
}
