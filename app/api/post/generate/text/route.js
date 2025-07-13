import { GoogleGenAI } from "@google/genai";

export const POST = async (req) => {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
      });
    }

    const genAI = new GoogleGenAI({
      apiKey: process.env.GOOGLE_GENETATIVE_AI, // Ensure correct env var name
    });

    const response = await genAI.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];

    if (!part || !part.text) {
      throw new Error("No text content generated.");
    }

    return new Response(JSON.stringify({ content: part.text }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
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
