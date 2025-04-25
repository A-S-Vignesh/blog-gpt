import { connectToDB } from "@/db/database";
import User from "@/db/models/user";

export const GET = async (req, { params }, res) => {
  try {
    const userId = params.userId;
    await connectToDB();
    const response = await User.findById(userId);
    return new Response(JSON.stringify(response), { status: 200 });
  } catch (error) {
    return new Response("Failed to fetch data", { status: 501 });
  }
};
