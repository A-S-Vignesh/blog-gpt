import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { rateLimit } from "@/lib/rateLimit";
import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { encryptSecret } from "@/lib/crypto/secretBox";

/**
 * Dedicated, separate endpoint for the user's bring-your-own Gemini API key.
 *
 * Kept OUT of the general profile-update route so the key is a deliberate
 * action (like the one-time username change) and a routine profile save can
 * never touch it. The key is:
 *   - ENCRYPTED at rest (AES-256-GCM) before storing,
 *   - NEVER returned to the client (the GET route exposes only a boolean),
 *   - validated for a plausible shape so junk isn't stored.
 */

// POST → set (replace) the key.
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      throw new ApiError("UNAUTHENTICATED", "Sign in required.");
    }

    const rl = await rateLimit({
      key: `gemini-key:${session.user._id.toString()}`,
      windowMs: 60 * 60 * 1000,
      max: 20,
    });
    if (!rl.ok) {
      throw new ApiError("RATE_LIMITED", "Too many attempts. Please wait a bit.", {
        retryAfterSeconds: rl.retryAfterSeconds,
      });
    }

    const body = (await req.json().catch(() => null)) as {
      geminiApiKey?: string;
    } | null;
    const key = typeof body?.geminiApiKey === "string" ? body.geminiApiKey.trim() : "";

    if (!key) {
      throw new ApiError("BAD_REQUEST", "API key is required.");
    }
    // Plausibility check (Google keys are ~39 chars; allow a generous range).
    if (key.length < 20 || key.length > 200 || /\s/.test(key)) {
      throw new ApiError(
        "VALIDATION_FAILED",
        "That doesn't look like a valid API key.",
      );
    }

    await connectToDatabase();
    await User.updateOne(
      { _id: session.user._id },
      { $set: { geminiApiKey: encryptSecret(key) } },
    );

    return Response.json({ ok: true, hasGeminiApiKey: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

// DELETE → remove the key.
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      throw new ApiError("UNAUTHENTICATED", "Sign in required.");
    }

    await connectToDatabase();
    await User.updateOne(
      { _id: session.user._id },
      { $set: { geminiApiKey: "" } },
    );

    return Response.json({ ok: true, hasGeminiApiKey: false });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
