import { connectToDB } from "@/db/database";
import User from "@/db/models/user";

export const GET = async (req, context) => {
  try {
    const { userId } = context.params;
    await connectToDB();
    const response = await User.findById(userId);
    return new Response(JSON.stringify(response), { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching user:", error);
    return new Response("Failed to fetch data", { status: 500 });
  }
};
