import { GoogleGenAI } from "@google/genai";
import { DEFAULT_SAFETY_SETTINGS } from "@/lib/ai/safety";

export type ModerationVerdict =
  | { status: "safe" }
  | { status: "flagged"; reason: string; categories: string[] }
  | { status: "error"; message: string };

const MODERATION_MODEL = "gemini-2.5-flash";

const MODERATION_SYSTEM_INSTRUCTION = `You are a strict content-moderation classifier for a public blogging platform.
Read the provided post content and decide if it should be published.

Reply with a SINGLE JSON object on one line and nothing else. Schema:
{"verdict":"safe"|"flagged","categories":["harassment"|"hate"|"sexual"|"violence"|"self_harm"|"illegal"|"spam"|"deceptive"],"reason":"short human-readable reason"}

Rules:
- Mark "flagged" if the post contains: targeted harassment, hate speech against protected groups, sexually explicit material, graphic violence, self-harm encouragement, instructions for illegal acts, obvious spam/SEO garbage, or deceptive scams.
- Strong opinions, criticism, profanity, and adult-but-not-explicit themes are SAFE.
- If unsure, prefer "safe".
- Output ONLY the JSON. No prose, no markdown, no code fences.`;

// Strip HTML tags so we don't waste tokens / confuse the model with markup.
function plainText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Run a Gemini classification pass on user content.
 *
 * Returns `{ status: "error" }` on upstream failure — callers should decide
 * whether to fail-open or fail-closed for their use case. For post publishing
 * we fail-open (allow) so a Gemini outage doesn't block all writes; flagged
 * posts can still be reviewed by admins after the fact.
 */
export async function moderateContent(
  rawContent: string,
  context: { title?: string } = {},
): Promise<ModerationVerdict> {
  const apiKey = process.env.GOOGLE_GENETATIVE_AI;
  if (!apiKey) {
    return { status: "error", message: "AI service not configured" };
  }

  const text = plainText(rawContent);
  if (!text) return { status: "safe" };

  // Cap the size we send to keep moderation cheap. The classifier doesn't
  // need the full article — a representative slice is enough.
  const SAMPLE_LIMIT = 6000;
  const sample = text.length > SAMPLE_LIMIT ? text.slice(0, SAMPLE_LIMIT) : text;

  const payload = [
    context.title ? `TITLE: ${context.title}` : "",
    `CONTENT:\n${sample}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const genAI = new GoogleGenAI({ apiKey });
    const response = await genAI.models.generateContent({
      model: MODERATION_MODEL,
      contents: payload,
      config: {
        systemInstruction: MODERATION_SYSTEM_INSTRUCTION,
        safetySettings: DEFAULT_SAFETY_SETTINGS as any,
        temperature: 0,
      },
    });

    const raw = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!raw) {
      return { status: "error", message: "Empty moderation response" };
    }

    // Some models wrap JSON in code fences despite instructions; strip them.
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let parsed: { verdict?: string; categories?: string[]; reason?: string };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.warn("[moderation] non-JSON response, treating as safe:", cleaned.slice(0, 200));
      return { status: "safe" };
    }

    if (parsed.verdict === "flagged") {
      return {
        status: "flagged",
        reason: parsed.reason || "Content flagged by moderation",
        categories: Array.isArray(parsed.categories) ? parsed.categories : [],
      };
    }

    return { status: "safe" };
  } catch (err: any) {
    console.error("[moderation] upstream error:", err);
    return { status: "error", message: err?.message || "Moderation failed" };
  }
}
