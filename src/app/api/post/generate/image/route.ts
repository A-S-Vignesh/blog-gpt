import { GoogleGenAI, Modality } from "@google/genai";

export const POST = async (req:Request) => {
  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const genAI = new GoogleGenAI({
      apiKey: process.env.GOOGLE_GENETATIVE_AI,
    });

    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: prompt,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
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
  } catch (err:any) {
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
