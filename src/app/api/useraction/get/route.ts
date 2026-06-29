import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

export const GET = async (req:Request) => {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user._id) {
    return new Response("Unauthorized", { status: 401 });
  }

  await connectToDatabase();

  try {
    // Strip secrets / internal fields before returning to the client. The
    // deletion cancel token is a capability secret, and the user's stored
    // Gemini API key must NEVER be serialized back to the browser — we expose
    // only a boolean so the UI can show "key saved" without handling the secret.
    const user = await User.findById(session.user._id).select(
      "-deletionCancelToken -deletionRequestedAt -razorpayCustomerId -razorpaySubscriptionId -bannedReason -__v",
    );

    if (!user) {
      return new Response("User not found", { status: 404 });
    }

    const obj = user.toObject();
    const hasGeminiApiKey =
      typeof obj.geminiApiKey === "string" && obj.geminiApiKey.length > 0;
    delete obj.geminiApiKey;

    return new Response(JSON.stringify({ ...obj, hasGeminiApiKey }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ Failed to fetch user:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
};
