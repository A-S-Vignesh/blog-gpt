import { GoogleGenerativeAI } from "@google/generative-ai";

export const POST = async (req, res) => {
  try {
    const { prompt } = await req.json();
    
    if (!prompt) {
      return new Response(
        JSON.stringify({ 
          error: "Prompt is required" 
        }), 
        { status: 400 }
      );
    }

    if (!process.env.GOOGLE_GENETATIVE_AI) {
      console.error("Missing GOOGLE_GENETATIVE_AI environment variable");
      return new Response(
        JSON.stringify({ 
          error: "API key not configured" 
        }), 
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENETATIVE_AI);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    if (!result || !result.response) {
      throw new Error("Failed to get response from Gemini API");
    }

    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error("Empty response from Gemini API");
    }

    return new Response(JSON.stringify({ content: text }), { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error("Error generating content:", error);
    return new Response(
      JSON.stringify({ 
        error: "Error generating content",
        details: error.message
      }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
};
