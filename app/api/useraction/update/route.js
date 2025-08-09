import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDB } from "@/db/database";
import User from "@/db/models/user";
import { revalidatePath } from "next/cache"; 

export async function PUT(req) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user._id) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  await connectToDB();
  try {
    const body = await req.json();

    // ✅ Check if username exists
    if (body.username) {
      const existingUser = await User.findOne({
        username: { $regex: new RegExp(`^${body.username}$`, "i") }, // case-insensitive exact match
      });

      if (existingUser && existingUser._id.toString() !== session.user._id) {
        return new Response(
          JSON.stringify({ message: "Username already taken" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }


    // ✅ Get old user to check username change
    const oldUser = await User.findById(session.user._id);

    const updatedUser = await User.findByIdAndUpdate(
      session.user._id,
      { $set: body },
      { new: true }
    );

    if (!updatedUser) {
      return new Response(JSON.stringify({ message: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const usernameChanged = body.username && body.username !== oldUser.username;
    // ✅ Revalidate paths if username changed
    if (usernameChanged) {
      revalidatePath(`/profile/${oldUser.username}`);
      revalidatePath(`/profile/${body.username}`);
    }

    return new Response(
      JSON.stringify({ updatedUser, forceLogout: usernameChanged }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("❌ Failed to update user:", err);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
