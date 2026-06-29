import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { sendEmail } from "@/lib/email/send";
import { accountDeletionCanceledEmail } from "@/lib/email/templates";
import { createHash } from "crypto";

/**
 * Cancel a scheduled account deletion.
 *
 * Two authentication paths:
 *   1) Signed-in user clicking "Cancel deletion" in settings.
 *   2) Anyone holding the one-time `cancelToken` from the deletion email.
 *
 * The token path is needed because deleted users can't sign in (auth callback
 * refuses them while `deletionScheduledFor` is set).
 */
export async function POST(req: Request) {
  try {
    // Rate-limit by IP — the token path is unauthenticated, so this blocks
    // brute-force / enumeration attempts against cancellation tokens.
    const ip = getClientIp(req);
    const rl = await rateLimit({
      key: `cancel-delete:${ip}`,
      windowMs: 60 * 60 * 1000,
      max: 10,
    });
    if (!rl.ok) {
      throw new ApiError(
        "RATE_LIMITED",
        "Too many attempts. Please try again later.",
        { retryAfterSeconds: rl.retryAfterSeconds },
      );
    }

    const body = (await req.json().catch(() => ({}))) as { token?: string };
    const token = body.token;

    await connectToDatabase();

    let user;
    if (token) {
      // Look up by the token's SHA-256 hash (the raw token is never stored).
      const hashedToken = createHash("sha256").update(token).digest("hex");
      user = await User.findOne({ deletionCancelToken: hashedToken });
    } else {
      const session = await getServerSession(authOptions);
      if (!session?.user?._id) {
        throw new ApiError(
          "UNAUTHENTICATED",
          "Sign in or provide a cancellation token.",
        );
      }
      user = await User.findById(session.user._id);
    }

    if (!user) {
      throw new ApiError(
        "NOT_FOUND",
        "Cancellation link is invalid or expired.",
      );
    }
    if (!user.deletionScheduledFor) {
      throw new ApiError(
        "CONFLICT",
        "No deletion is currently scheduled for this account.",
      );
    }

    user.deletionScheduledFor = null;
    user.deletionCancelToken = "";
    user.deletionRequestedAt = null;
    if (user.planStatus === "canceled") {
      // Restore active state — they decided to keep the account.
      user.planStatus = "active";
    }
    await user.save();

    const tpl = accountDeletionCanceledEmail({ name: user.name });
    void sendEmail({
      to: user.email,
      subject: tpl.subject,
      html: tpl.html,
      tag: "account-deletion-canceled",
    });

    return Response.json({
      ok: true,
      message: "Your account deletion has been canceled.",
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
