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
    const user = await User.findById(session.user._id);

    if (!user) {
      return new Response("User not found", { status: 404 });
    }

    return new Response(JSON.stringify(user), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ Failed to fetch user:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
};
