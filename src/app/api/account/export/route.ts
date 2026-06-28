import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import Post from "@/models/Post";
import Comment from "@/models/Comment";
import { Subscription } from "@/models/Subscription";
import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { rateLimit } from "@/lib/rateLimit";

/**
 * GDPR data portability: return everything we have about the signed-in user
 * as a single downloadable JSON file. Excludes internal fields that aren't
 * personal data (e.g. mongoose-internal __v).
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      throw new ApiError("UNAUTHENTICATED", "Sign in required.");
    }
    const userId = session.user._id;

    const rl = await rateLimit({
      key: `export-data:${userId}`,
      windowMs: 60 * 60 * 1000,
      max: 5,
    });
    if (!rl.ok) {
      throw new ApiError(
        "RATE_LIMITED",
        "Data export requests are limited. Try again later.",
        { retryAfterSeconds: rl.retryAfterSeconds },
      );
    }

    await connectToDatabase();

    const [user, posts, comments, subscriptions] = await Promise.all([
      User.findById(userId)
        .select(
          "-__v -deletionCancelToken -razorpayCustomerId -razorpaySubscriptionId",
        )
        .lean(),
      Post.find({ creator: userId }).select("-__v").lean(),
      Comment.find({ userId }).select("-__v").lean(),
      Subscription.find({ user: userId })
        .select("-__v -providerCustomerId")
        .lean(),
    ]);

    if (!user) {
      throw new ApiError("NOT_FOUND", "User account not found.");
    }

    const payload = {
      exportedAt: new Date().toISOString(),
      schema: "thebloggpt.user-export.v1",
      user,
      posts,
      comments,
      subscriptions,
    };

    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="thebloggpt-export-${userId}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
