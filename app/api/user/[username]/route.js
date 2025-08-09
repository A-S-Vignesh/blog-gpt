
import { connectToDB } from "@/db/database";
import User from "@/db/models/user";
import Post from "@/db/models/post";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export const GET = async (req, context) => {
  try {
    const { username } = context.params;
    const session = await getServerSession(authOptions);

    await connectToDB();

    // Fetch user with minimal fields
    const user = await User.findOne({ username })
      .select("name username bio socials image email createdAt")
      .lean();

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const isOwner = session?.user?.username === username;

    // Mask email if not owner
    if (user.email && !isOwner) {
      const [namePart, domain] = user.email.split("@");
      const maskedName =
        namePart.slice(0, 2) + "*".repeat(4) + namePart.slice(-1);
      const maskedDomain =
        domain.charAt(0) + "*".repeat(4) + domain.slice(domain.indexOf("."));
      user.email = `${maskedName}@${maskedDomain}`;
    }

    return new Response(JSON.stringify(user), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Error fetching user securely:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
