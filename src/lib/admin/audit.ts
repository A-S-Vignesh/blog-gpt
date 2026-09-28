import { connectToDatabase } from "@/lib/mongodb";
import AdminAuditLog, { type AdminAction } from "@/models/AdminAuditLog";
import { getClientIp } from "@/lib/rateLimit";
import type { AdminActor } from "@/lib/admin/guard";

type LogInput = {
  actor: AdminActor;
  action: AdminAction;
  targetType: "post" | "comment" | "user" | "message" | "campaign";
  targetId: string;
  targetLabel?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  reason?: string;
  req?: Request;
};

/**
 * Append one entry to the admin audit log.
 *
 * Intentionally awaited by callers BEFORE the response is returned, so a
 * successful admin mutation is never reported to the browser without a
 * corresponding log line. It still swallows its own errors: a logging failure
 * must not roll back or hide a mutation that already committed — it is
 * reported to the server console instead.
 */
export async function logAdminAction(input: LogInput): Promise<void> {
  try {
    await connectToDatabase();
    await AdminAuditLog.create({
      actor: input.actor.objectId,
      actorEmail: input.actor.email,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      targetLabel: input.targetLabel || "",
      before: input.before,
      after: input.after,
      reason: input.reason || "",
      ip: input.req ? getClientIp(input.req) : "",
    });
  } catch (err) {
    console.error("[admin/audit] failed to write audit entry:", err);
  }
}
