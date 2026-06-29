import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { rateLimit } from "@/lib/rateLimit";
import { ApiError, apiErrorResponse } from "@/lib/api/errors";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      throw new ApiError("UNAUTHENTICATED", "Sign in required.");
    }

    const rlResult = await rateLimit({
      key: `update-user:${session.user._id.toString()}`,
      windowMs: 60 * 60 * 1000,
      max: 20,
    });
    if (!rlResult.ok) {
      throw new ApiError(
        "RATE_LIMITED",
        "You are updating your profile too frequently. Please wait a while before trying again.",
        { retryAfterSeconds: rlResult.retryAfterSeconds },
      );
    }

    await connectToDatabase();
    const body = await req.json();

    const oldUser = await User.findById(session.user._id);
    if (!oldUser) {
      throw new ApiError("NOT_FOUND", "User not found.");
    }

    // SECURITY: only ever update an explicit whitelist of profile fields.
    // Never `$set` the raw body — that is mass-assignment and would let a user
    // set role/plan/planStatus/aiExtraCredits/banned, escalating privileges or
    // granting themselves a paid plan for free.
    //
    // NOTE: `username` is intentionally NOT in this list. The handle changes
    // only through the dedicated one-time endpoint at /api/useraction/username,
    // so a routine profile save can never alter it (and can't burn the user's
    // single change by accident).
    // NOTE: `username` and `geminiApiKey` are intentionally NOT here — each has
    // its own dedicated endpoint (/useraction/username, /useraction/gemini-key)
    // so a routine profile save can never alter the handle or the (encrypted)
    // API key.
    const ALLOWED_FIELDS = ["name", "bio", "website", "image", "socials"];
    const update: Record<string, unknown> = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in body) update[key] = body[key];
    }

    const updatedUser = await User.findByIdAndUpdate(
      session.user._id,
      { $set: update },
      { new: true, runValidators: true },
    ).select(
      // Same secret-stripping as the GET route — never return capability
      // secrets (deletion token), internal payment ids, or the Gemini API key.
      "-deletionCancelToken -deletionRequestedAt -razorpayCustomerId -razorpaySubscriptionId -bannedReason -geminiApiKey -__v",
    );

    if (!updatedUser) {
      throw new ApiError("NOT_FOUND", "User not found.");
    }

    // Report whether a key is stored (never the secret). The key is only
    // changed via the dedicated endpoint, so this just reflects current state.
    const hasGeminiApiKey =
      typeof oldUser.geminiApiKey === "string" &&
      oldUser.geminiApiKey.length > 0;

    return new Response(
      JSON.stringify({
        updatedUser: { ...updatedUser.toObject(), hasGeminiApiKey },
        forceLogout: false,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    return apiErrorResponse(err);
  }
}
