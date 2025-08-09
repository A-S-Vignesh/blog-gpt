import { connectToDB } from "@/db/database";
import User from "@/db/models/user";

export const GET = async (req, res) => {
  try {
    const username = req.nextUrl.searchParams.get("username");
    const userId = req.nextUrl.searchParams.get("userId");
    await connectToDB();
    let isAvailable = true;
    const existingUser = await User.findOne({ username: username });

    if (existingUser && existingUser._id != userId) {
      isAvailable = false;
    } else if (existingUser && existingUser._id == userId) {
      isAvailable = true;
    } else {
      await User.findByIdAndUpdate(userId, {
        username: username,
      })
        .then(() => console.log("username update successfully!"))
        .catch((err) => console.log(err));
    }
    return new Response(JSON.stringify({ isAvailable }), {
      status: 200,
    });
  } catch (error) {
    return new Response("Failed the check username availablity", {
      status: 501,
    });
  }
};
