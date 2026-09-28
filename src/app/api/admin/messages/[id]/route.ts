import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { requireAdminMutation } from "@/lib/admin/guard";
import { logAdminAction } from "@/lib/admin/audit";
import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { rateLimit } from "@/lib/rateLimit";
import { connectToDatabase } from "@/lib/mongodb";
import ContactMessage from "@/models/ContactMessage";

export const dynamic = "force-dynamic";

const STATUSES = ["new", "read", "replied"] as const;
type MessageStatus = (typeof STATUSES)[number];

/** Move a contact message between new / read / replied. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdminMutation(req);
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError("BAD_REQUEST", "Invalid message id.");
    }

    const body = await req.json().catch(() => ({}));
    const status = body?.status as MessageStatus;
    if (!STATUSES.includes(status)) {
      throw new ApiError(
        "BAD_REQUEST",
        `status must be one of: ${STATUSES.join(", ")}.`,
      );
    }

    await connectToDatabase();
    const message = await ContactMessage.findById(id).select("status subject");
    if (!message) {
      throw new ApiError("NOT_FOUND", "Message not found.");
    }

    const before = { status: message.status };
    if (message.status === status) {
      return NextResponse.json({ ok: true, status, unchanged: true });
    }

    await ContactMessage.updateOne({ _id: id }, { $set: { status } });

    await logAdminAction({
      actor,
      action: "message.status",
      targetType: "message",
      targetId: id,
      targetLabel: message.subject,
      before,
      after: { status },
      req,
    });

    return NextResponse.json({ ok: true, status });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

/** Permanently remove a contact message. */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdminMutation(req);
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError("BAD_REQUEST", "Invalid message id.");
    }

    const rl = await rateLimit({
      key: `admin-message-delete:${actor.id}`,
      windowMs: 60 * 1000,
      max: 60,
    });
    if (!rl.ok) {
      throw new ApiError("RATE_LIMITED", "Too many deletions.", {
        retryAfterSeconds: rl.retryAfterSeconds,
      });
    }

    await connectToDatabase();
    const message = await ContactMessage.findById(id);
    if (!message) {
      throw new ApiError("NOT_FOUND", "Message not found.");
    }

    await ContactMessage.deleteOne({ _id: id });

    // The sender's address and subject are kept in the log so a deleted
    // enquiry can still be traced back if someone asks why it vanished.
    await logAdminAction({
      actor,
      action: "message.delete",
      targetType: "message",
      targetId: id,
      targetLabel: message.subject,
      before: {
        from: message.email,
        subject: message.subject,
        status: message.status,
      },
      req,
    });

    return NextResponse.json({ ok: true, id });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
