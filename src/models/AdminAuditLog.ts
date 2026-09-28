import { Schema, model, models, Document, Types } from "mongoose";

/**
 * Append-only record of every mutating action taken from the admin panel.
 *
 * The panel can ban accounts, delete posts, and change roles — actions with no
 * other trace in the system once the target row is gone. This log is the only
 * way to answer "who removed that post, and when?" after the fact, so it is
 * written on the same request as the mutation and never updated or deleted by
 * application code.
 *
 * `before`/`after` hold only the fields the action actually touched, never a
 * whole document — that keeps secrets (geminiApiKey, deletionCancelToken,
 * Razorpay ids) out of the log by construction.
 */
export type AdminAction =
  | "post.approve"
  | "post.flag"
  | "post.unpublish"
  | "post.delete"
  | "comment.delete"
  | "message.status"
  | "message.delete"
  | "user.ban"
  | "user.unban"
  | "user.role"
  | "user.plan"
  | "user.credits"
  | "ad.approve"
  | "ad.reject"
  | "ad.pause"
  | "ad.resume"
  | "ad.mark_paid"
  | "ad.refund";

export interface IAdminAuditLog extends Document {
  actor: Types.ObjectId;
  actorEmail: string;
  action: AdminAction;
  targetType: "post" | "comment" | "user" | "message" | "campaign";
  targetId: string;
  /** Human-readable handle for the target, so the log stays readable after deletion. */
  targetLabel?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  reason?: string;
  ip?: string;
  createdAt: Date;
}

const AdminAuditLogSchema = new Schema<IAdminAuditLog>(
  {
    actor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    actorEmail: { type: String, required: true },
    action: { type: String, required: true, index: true },
    targetType: {
      type: String,
      enum: ["post", "comment", "user", "message", "campaign"],
      required: true,
    },
    targetId: { type: String, required: true, index: true },
    targetLabel: { type: String, default: "" },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    reason: { type: String, default: "", maxlength: 500 },
    ip: { type: String, default: "" },
  },
  // `updatedAt` would be meaningless on an append-only log.
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Backs the audit browser: newest-first, with _id as a stable tiebreaker.
AdminAuditLogSchema.index({ createdAt: -1, _id: -1 });

const AdminAuditLog =
  models.AdminAuditLog ||
  model<IAdminAuditLog>("AdminAuditLog", AdminAuditLogSchema);
export default AdminAuditLog;
