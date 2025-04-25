import { GoogleGenerativeAI } from "@google/generative-ai";

export const POST = async (req, res) => {
  const { prompt } = await req.json();
  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENETATIVE_AI);
    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
      response_mime_type: "application/json",
    });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    return new Response(JSON.stringify(text), { status: 200 });
  } catch (error) {
    return new Response("Error generating content", err, { status: 500 });
  }
};
