import { GoogleGenAI, Modality } from "@google/genai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { rateLimit } from "@/lib/rateLimit";
import { imageSystemInstruction } from "@/config/systemInstruction";

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

    const MAX_PROMPT_LENGTH = 1000;
    if (prompt.length > MAX_PROMPT_LENGTH) {
      return new Response(
        JSON.stringify({
          error: `Prompt is too long (max ${MAX_PROMPT_LENGTH} characters). Please shorten your description.`,
          code: "PROMPT_TOO_LONG",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const rlResult = rateLimit({
      key: `ai-image:${session.user._id.toString()}`,
      windowMs: 60_000, // 1 minute
      max: 3, // images are more expensive, keep this lower
    });

    if (!rlResult.ok) {
      return new Response(
        JSON.stringify({
          error:
            "Too many image generation requests. Please wait a few seconds and try again.",
          code: "RATE_LIMITED",
          retryAfterSeconds: rlResult.retryAfterSeconds,
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const genAI = new GoogleGenAI({
      apiKey: process.env.GOOGLE_GENETATIVE_AI,
    });

    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: prompt,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
        systemInstruction: imageSystemInstruction,
      },
    });

    const parts = result?.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p) => p.inlineData?.data);
    if (!imagePart || !imagePart.inlineData?.data) {
      return new Response(JSON.stringify({ error: "No image returned" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: base64, mimeType = "image/png" } = imagePart.inlineData;

    return new Response(
      JSON.stringify({ image: `data:${mimeType};base64,${base64}` }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("Image generation error:", err);
    return new Response(
      JSON.stringify({
        error: "Image generation failed",
        details: err.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
