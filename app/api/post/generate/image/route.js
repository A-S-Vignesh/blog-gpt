import { GoogleGenAI, Modality } from "@google/genai";

export const POST = async (req) => {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
      });
    }

    const genAI = new GoogleGenAI({
      apiKey: process.env.GOOGLE_GENETATIVE_AI,
    });

    const result = await genAI.models.generateContent({
      model: "gemini-1.5-pro", // or "gemini-1.5-flash" if you want faster response
      contents: prompt,
      config: {
        responseModalities: [Modality.IMAGE], // 🔥 Important for image generation
      },
    });

    const parts = result?.candidates?.[0]?.content?.parts || [];

    const imagePart = parts.find((part) => part.inlineData?.data);

    if (!imagePart) {
      throw new Error("No image returned from Gemini API.");
    }

    const imageBase64 = imagePart.inlineData.data;
    const mimeType = imagePart.inlineData.mimeType || "image/png";

    return new Response(
      JSON.stringify({ image: `data:${mimeType};base64,${imageBase64}` }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Image generation error:", error);
    return new Response(
      JSON.stringify({
        error: "Image generation failed.",
        details: error.message,
      }),
      { status: 500 }
    );
  }
};
