import { GoogleGenAI, Modality } from "@google/genai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getPlanById } from "@/config/plans";
import { rateLimit } from "@/lib/rateLimit";
import { imageSystemInstruction } from "@/config/systemInstruction";
import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { checkPromptSafety } from "@/lib/ai/promptSafety";
import { DEFAULT_SAFETY_SETTINGS } from "@/lib/ai/safety";
import { reserveAiCredit, refundAiCredit } from "@/lib/ai/quota";

const MAX_PROMPT_LENGTH = 1000;
const PER_MINUTE_LIMIT = 3;
const PER_DAY_LIMIT = 20;

export const POST = async (req: Request) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?._id) {
      throw new ApiError("UNAUTHENTICATED", "You must be signed in to generate images.");
    }

    const userId = session.user._id.toString();
    const body = (await req.json().catch(() => null)) as { prompt?: string } | null;
    const prompt = typeof body?.prompt === "string" ? body.prompt : "";

    const safety = checkPromptSafety(prompt, MAX_PROMPT_LENGTH);
    if (!safety.ok) {
      if (safety.reason === "empty") {
        throw new ApiError("BAD_REQUEST", "Prompt is required.");
      }
      if (safety.reason === "length") {
        throw new ApiError(
          "PROMPT_TOO_LONG",
          `Prompt is too long. Max ${MAX_PROMPT_LENGTH} characters.`,
        );
      }
      throw new ApiError(
        "PROMPT_REJECTED",
        safety.reason === "harmful"
          ? "This prompt requests disallowed content."
          : "This prompt looks like a prompt-injection attempt and was blocked.",
      );
    }

    const minuteLimit = await rateLimit({
      key: `ai-image:minute:${userId}`,
      windowMs: 60_000,
      max: PER_MINUTE_LIMIT,
    });
    if (!minuteLimit.ok) {
      throw new ApiError(
        "RATE_LIMITED",
        "Too many image requests. Please wait a few seconds and try again.",
        { retryAfterSeconds: minuteLimit.retryAfterSeconds },
      );
    }

    const dayLimit = await rateLimit({
      key: `ai-image:day:${userId}`,
      windowMs: 24 * 60 * 60 * 1000,
      max: PER_DAY_LIMIT,
    });
    if (!dayLimit.ok) {
      throw new ApiError(
        "RATE_LIMITED",
        `Daily image-generation limit reached (${PER_DAY_LIMIT}/day).`,
        { retryAfterSeconds: dayLimit.retryAfterSeconds },
      );
    }

    await connectToDatabase();

    const user = await User.findById(session.user._id).select(
      "plan planStatus",
    );
    if (!user) {
      throw new ApiError("NOT_FOUND", "User account not found.");
    }

    // A lapsed (past_due) subscription falls back to the FREE quota — an unpaid
    // plan must not keep consuming its higher allowance. A "canceled" plan keeps
    // access until the period ends (a downgrade cron finalizes it), so it is
    // intentionally NOT restricted here.
    const effectivePlanId =
      user.planStatus === "past_due" ? "free" : user.plan || "free";
    const userPlan = getPlanById(effectivePlanId);
    const monthlyLimit = userPlan.aiGenerationsPerMonth ?? 0;

    // Reserve one credit ATOMICALLY before spending money on the model (see the
    // text route / lib/ai/quota for the full rationale). Refunded on failure.
    const reservation = await reserveAiCredit(userId, monthlyLimit);
    if (!reservation.ok) {
      throw new ApiError(
        "PLAN_LIMIT_REACHED",
        "You have reached your monthly AI generation limit. Upgrade your plan or purchase extra credits to continue.",
        { plan: userPlan.id, monthlyLimit },
      );
    }
    const creditSource = reservation.source!;

    const apiKey = process.env.GOOGLE_GENETATIVE_AI;
    if (!apiKey) {
      await refundAiCredit(userId, creditSource);
      throw new ApiError("INTERNAL_ERROR", "AI service is not configured.");
    }
    const genAI = new GoogleGenAI({ apiKey });

    let result;
    try {
      result = await genAI.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: prompt,
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
          systemInstruction: imageSystemInstruction,
          safetySettings: DEFAULT_SAFETY_SETTINGS as any,
        },
      });
    } catch (err: any) {
      await refundAiCredit(userId, creditSource);
      console.error("[ai-image] upstream error:", err);
      throw new ApiError(
        "UPSTREAM_ERROR",
        "AI provider is currently unavailable. Please try again in a moment.",
      );
    }

    const blockReason = result.promptFeedback?.blockReason;
    if (blockReason) {
      await refundAiCredit(userId, creditSource);
      throw new ApiError(
        "CONTENT_FLAGGED",
        "The AI declined to generate this image due to safety filters.",
        { reason: String(blockReason) },
      );
    }

    const parts = result?.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p) => p.inlineData?.data);
    if (!imagePart?.inlineData?.data) {
      await refundAiCredit(userId, creditSource);
      throw new ApiError(
        "UPSTREAM_ERROR",
        "AI did not return an image. Please rephrase your prompt and try again.",
      );
    }

    const { data: base64, mimeType = "image/png" } = imagePart.inlineData;
    return new Response(
      JSON.stringify({ image: `data:${mimeType};base64,${base64}` }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    return apiErrorResponse(err);
  }
};
