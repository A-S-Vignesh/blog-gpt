import { GoogleGenAI } from "@google/genai";
import { DEFAULT_SAFETY_SETTINGS } from "@/lib/ai/safety";
import type { ModerationVerdict } from "@/lib/ai/moderation";

const IMAGE_MODERATION_MODEL = "gemini-2.5-flash";

const IMAGE_MODERATION_SYSTEM_INSTRUCTION = `You are a strict image content-moderation classifier for a public blogging platform.
Look at the provided image and decide if it may be published as a blog cover image.

Reply with a SINGLE JSON object on one line and nothing else. Schema:
{"verdict":"safe"|"flagged","categories":["sexual"|"nudity"|"violence"|"gore"|"hate"|"self_harm"|"illegal"|"shocking"],"reason":"short human-readable reason"}

Rules:
- Mark "flagged" if the image contains: nudity or sexually explicit content, graphic violence or gore, hateful symbols, self-harm, any sexual content involving minors, or otherwise illegal/shocking material.
- Ordinary photos, illustrations, diagrams, screenshots, product shots, scenery, and non-explicit art are SAFE.
- If you genuinely cannot tell, prefer "safe".
- Output ONLY the JSON. No prose, no markdown, no code fences.`;

function parseDataUri(
  dataUri: string,
): { mimeType: string; data: string } | null {
  const m = /^data:([^;]+);base64,([\s\S]+)$/.exec(dataUri);
  if (!m) return null;
  return { mimeType: m[1], data: m[2] };
}

/**
 * Classify an inline image (base64 data URI) for disallowed visual content
 * using Gemini vision. Mirrors moderateContent(): returns {status:"error"} on
 * upstream failure so the caller decides whether to fail-open or fail-closed.
 *
 * A non-data-URI input (e.g. an external URL we didn't upload) returns "safe" —
 * there's nothing local to inspect, and other checks still apply.
 */
export async function moderateImage(
  dataUri: string,
): Promise<ModerationVerdict> {
  const apiKey = process.env.GOOGLE_GENETATIVE_AI;
  if (!apiKey) return { status: "error", message: "AI service not configured" };

  const parsed = parseDataUri(dataUri);
  if (!parsed) return { status: "safe" };

  try {
    const genAI = new GoogleGenAI({ apiKey });
    const response = await genAI.models.generateContent({
      model: IMAGE_MODERATION_MODEL,
      contents: [
        { inlineData: { mimeType: parsed.mimeType, data: parsed.data } },
        { text: "Classify this image per your instructions." },
      ],
      config: {
        systemInstruction: IMAGE_MODERATION_SYSTEM_INSTRUCTION,
        safetySettings: DEFAULT_SAFETY_SETTINGS as any,
        temperature: 0,
      },
    });

    // If Gemini's own safety layer refused to describe the image, that itself
    // is a strong signal the image is disallowed — treat as flagged.
    const blockReason = response.promptFeedback?.blockReason;
    if (blockReason) {
      return {
        status: "flagged",
        reason: `Blocked by AI safety filter (${String(blockReason)})`,
        categories: ["shocking"],
      };
    }

    const raw = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!raw) return { status: "error", message: "Empty moderation response" };

    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let parsedVerdict: {
      verdict?: string;
      categories?: string[];
      reason?: string;
    };
    try {
      parsedVerdict = JSON.parse(cleaned);
    } catch {
      console.warn(
        "[image-moderation] non-JSON response, treating as safe:",
        cleaned.slice(0, 200),
      );
      return { status: "safe" };
    }

    if (parsedVerdict.verdict === "flagged") {
      return {
        status: "flagged",
        reason: parsedVerdict.reason || "Image flagged by moderation",
        categories: Array.isArray(parsedVerdict.categories)
          ? parsedVerdict.categories
          : [],
      };
    }

    return { status: "safe" };
  } catch (err: any) {
    console.error("[image-moderation] upstream error:", err);
    return { status: "error", message: err?.message || "Image moderation failed" };
  }
}
