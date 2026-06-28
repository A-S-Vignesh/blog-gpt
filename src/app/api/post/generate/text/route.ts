import { GoogleGenAI } from "@google/genai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getPlanById } from "@/config/plans";
import { rateLimit } from "@/lib/rateLimit";
import { systemInstruction } from "@/config/systemInstruction";
import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { checkPromptSafety } from "@/lib/ai/promptSafety";
import { DEFAULT_SAFETY_SETTINGS } from "@/lib/ai/safety";
import { reserveAiCredit, refundAiCredit } from "@/lib/ai/quota";

const MAX_PROMPT_LENGTH = 4000;
const PER_MINUTE_LIMIT = 10;
const PER_DAY_LIMIT = 50;

export const POST = async (req: Request) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?._id) {
      throw new ApiError("UNAUTHENTICATED", "You must be signed in to generate content.");
    }

    const userId = session.user._id.toString();
    const body = (await req.json().catch(() => null)) as
      | { prompt?: string; title?: string }
      | null;
    const prompt = typeof body?.prompt === "string" ? body.prompt : "";
    const title = typeof body?.title === "string" ? body.title.trim() : "";

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
      key: `ai-text:minute:${userId}`,
      windowMs: 60_000,
      max: PER_MINUTE_LIMIT,
    });
    if (!minuteLimit.ok) {
      throw new ApiError(
        "RATE_LIMITED",
        "Too many requests. Please wait a few seconds and try again.",
        { retryAfterSeconds: minuteLimit.retryAfterSeconds },
      );
    }

    const dayLimit = await rateLimit({
      key: `ai-text:day:${userId}`,
      windowMs: 24 * 60 * 60 * 1000,
      max: PER_DAY_LIMIT,
    });
    if (!dayLimit.ok) {
      throw new ApiError(
        "RATE_LIMITED",
        `Daily AI request limit reached (${PER_DAY_LIMIT}/day). Try again tomorrow or upgrade your plan.`,
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

    // Reserve one credit ATOMICALLY before spending money on the model. The DB
    // enforces the quota, closing the read-then-write race; refunded on failure.
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

    // Give the model the chosen title so the article's keyword, headings, and
    // angle align with it — better topical relevance and on-page SEO.
    const userContent = title
      ? `Blog title: "${title}"\n\nWriting instructions:\n${prompt}`
      : prompt;

    let response;
    try {
      response = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: userContent,
        config: {
          systemInstruction,
          safetySettings: DEFAULT_SAFETY_SETTINGS as any,
        },
      });
    } catch (err: any) {
      await refundAiCredit(userId, creditSource);
      console.error("[ai-text] upstream error:", err);
      throw new ApiError(
        "UPSTREAM_ERROR",
        "AI provider is currently unavailable. Please try again in a moment.",
      );
    }

    const blockReason = response.promptFeedback?.blockReason;
    if (blockReason) {
      await refundAiCredit(userId, creditSource);
      throw new ApiError(
        "CONTENT_FLAGGED",
        "The AI declined to answer this prompt due to safety filters.",
        { reason: String(blockReason) },
      );
    }

    const part = response.candidates?.[0]?.content?.parts?.[0];
    const generated = part?.text;
    if (!generated) {
      await refundAiCredit(userId, creditSource);
      throw new ApiError(
        "UPSTREAM_ERROR",
        "AI did not return any content. Please rephrase your prompt and try again.",
      );
    }

    return new Response(JSON.stringify({ content: generated }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
};
