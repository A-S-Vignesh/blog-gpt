import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { revalidatePath } from "next/cache";
import { rateLimit } from "@/lib/rateLimit";
import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { isReservedUsername } from "@/utils/reservedWords";

const USERNAME_REGEX =
  /^(?=.{6,20}$)(?![_-])(?!.*[_-]{2})[a-zA-Z0-9_-]+(?<![_-])$/;

/**
 * One-time username change.
 *
 * A user may change their handle EXACTLY ONCE; after that it is permanent. The
 * old handle is recorded as `previousUsername` so that:
 *   - old /{username} and /{username}/{slug} links 301-redirect to the new one
 *     (no lost SEO, no broken shared links), and
 *   - the retired handle is never reassigned to anyone else (no impersonation,
 *     no redirect collisions).
 *
 * Because there is at most one change per user, there is at most one retired
 * handle, so the redirect is always a single hop (no chains).
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      throw new ApiError("UNAUTHENTICATED", "Sign in required.");
    }

    const rl = await rateLimit({
      key: `change-username:${session.user._id.toString()}`,
      windowMs: 60 * 60 * 1000,
      max: 5,
    });
    if (!rl.ok) {
      throw new ApiError("RATE_LIMITED", "Too many attempts. Please wait a while.", {
        retryAfterSeconds: rl.retryAfterSeconds,
      });
    }

    const body = (await req.json().catch(() => null)) as {
      username?: string;
    } | null;
    // Trim but PRESERVE case — the display handle keeps its capitalization;
    // uniqueness is handled case-insensitively via collation below.
    const desired = typeof body?.username === "string" ? body.username.trim() : "";
    if (!desired) {
      throw new ApiError("BAD_REQUEST", "Username is required.");
    }

    await connectToDatabase();

    const user = await User.findById(session.user._id);
    if (!user) {
      throw new ApiError("NOT_FOUND", "User not found.");
    }

    // Already used the one-time change → permanent. Check BOTH markers (either
    // being set means a change has happened) so the lock can't be slipped.
    if (user.usernameChangedAt || user.previousUsername) {
      throw new ApiError(
        "FORBIDDEN",
        "You've already used your one-time username change. Usernames can't be changed again.",
      );
    }

    // No-op (exact, case-preserving).
    if (desired === user.username) {
      throw new ApiError("BAD_REQUEST", "That's already your username.");
    }

    // Format (mirrors the schema regex for a friendly message).
    if (!USERNAME_REGEX.test(desired)) {
      throw new ApiError(
        "VALIDATION_FAILED",
        "Username must be 6-20 characters: letters, numbers, _ or - (no leading/trailing or doubled separators).",
      );
    }

    // Reserved words.
    if (isReservedUsername(desired)) {
      throw new ApiError(
        "VALIDATION_FAILED",
        `"${desired}" is reserved and cannot be used as a username.`,
      );
    }

    // Uniqueness: not an existing current handle (case-insensitive, no regex
    // built from user input).
    const taken = await User.findOne({ username: desired })
      .collation({ locale: "en", strength: 2 })
      .select("_id");
    if (taken && taken._id.toString() !== session.user._id) {
      throw new ApiError("CONFLICT", "That username is already taken.");
    }

    // Reservation: not a retired handle still held by ANOTHER user (taking it
    // would break their redirect and enable impersonation).
    const reserved = await User.findOne({ previousUsername: desired })
      .collation({ locale: "en", strength: 2 })
      .select("_id");
    if (reserved && reserved._id.toString() !== session.user._id) {
      throw new ApiError("CONFLICT", "That username is no longer available.");
    }

    const oldUsername = user.username;
    user.username = desired;
    user.previousUsername = oldUsername;
    user.usernameChangedAt = new Date();
    await user.save();

    // Refresh both the old and new profile routes so caches reflect the change.
    revalidatePath(`/${oldUsername}`);
    revalidatePath(`/${desired}`);

    return Response.json({
      ok: true,
      username: desired,
      // The session JWT still carries the old username, so force a re-login to
      // resync it everywhere.
      forceLogout: true,
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
