import { GoogleGenAI } from "@google/genai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getPlanById } from "@/config/plans";
import { rateLimit } from "@/lib/rateLimit";
import { systemInstruction } from "@/config/systemInstruction";

const isSameBillingMonth = (a?: Date | null, b?: Date | null) => {
  if (!a || !b) return false;
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth()
  );
};

export const POST = async (req: Request) => {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?._id) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", code: "UNAUTHENTICATED" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { prompt } = (await req.json()) as { prompt?: string };

    if (!prompt || typeof prompt !== "string") {
      return new Response(
        JSON.stringify({ error: "Prompt is required", code: "BAD_REQUEST" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Basic prompt length guard to avoid extremely large payloads
    const MAX_PROMPT_LENGTH = 4000;
    if (prompt.length > MAX_PROMPT_LENGTH) {
      return new Response(
        JSON.stringify({
          error: `Prompt is too long (max ${MAX_PROMPT_LENGTH} characters). Please shorten your request.`,
          code: "PROMPT_TOO_LONG",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    await connectToDatabase();

    const user = await User.findById(session.user._id);
    if (!user) {
      return new Response(
        JSON.stringify({ error: "User not found", code: "USER_NOT_FOUND" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const now = new Date();
    const userPlan = getPlanById(user.plan || "free");

    // Per-user rate limiting to prevent abuse while still allowing
    // legitimate viral traffic from many distinct users.
    const rlResult = rateLimit({
      key: `ai-text:${user._id.toString()}`,
      windowMs: 60_000, // 1 minute
      max: 10, // up to 10 AI generations per minute per user
    });

    if (!rlResult.ok) {
      return new Response(
        JSON.stringify({
          error:
            "Too many AI generation requests. Please wait a few seconds and try again.",
          code: "RATE_LIMITED",
          retryAfterSeconds: rlResult.retryAfterSeconds,
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Reset monthly usage counter if we are in a new month
    if (!isSameBillingMonth(user.aiUsagePeriodStart, now)) {
      user.aiUsagePeriodStart = now;
      user.aiGenerationCount = 0;
    }

    const monthlyLimit = userPlan.aiGenerationsPerMonth ?? 0;
    const usedThisMonth = user.aiGenerationCount ?? 0;
    const extraCredits = user.aiExtraCredits ?? 0;

    const remainingInPlan = Math.max(monthlyLimit - usedThisMonth, 0);
    const totalRemaining = remainingInPlan + extraCredits;

    if (totalRemaining <= 0) {
      return new Response(
        JSON.stringify({
          error:
            "You have reached your current AI generation limit. Upgrade your plan or purchase extra credits to continue.",
          code: "PLAN_LIMIT_REACHED",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const genAI = new GoogleGenAI({
      apiKey: process.env.GOOGLE_GENETATIVE_AI,
    });

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];

    if (!part || !part.text) {
      throw new Error("No text content generated.");
    }

    // Only count successful generations
    if (remainingInPlan > 0) {
      user.aiGenerationCount += 1;
    } else if (extraCredits > 0) {
      user.aiExtraCredits = extraCredits - 1;
    }
    await user.save();

    return new Response(JSON.stringify({ content: part.text }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Text generation error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to generate content",
        details: error.message,
      }),
      { status: 500 }
    );
  }
};
