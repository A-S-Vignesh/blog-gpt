import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Subscription } from "@/models/Subscription";

export const runtime = "nodejs";
// Never cache a cron run.
export const dynamic = "force-dynamic";

/**
 * Cron: finalize canceled subscriptions whose paid access window has ended.
 *
 * When a user cancels, we keep them on their paid plan until the end of the
 * current billing period (subscription.endsAt). This job — promised by the
 * webhook/AI-route comments but previously missing — runs on a schedule, finds
 * any subscription still marked "canceled" whose endsAt has passed, and
 * downgrades the owning user to the free plan.
 *
 * Configure as a Vercel Cron in vercel.json:
 *   { "path": "/api/cron/downgrade-plans", "schedule": "0 3 * * *" }
 *
 * Protected by CRON_SECRET (same bearer scheme as process-deletions) so
 * external traffic cannot trigger downgrades.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return new NextResponse("Cron not configured", { status: 503 });
  }
  const provided = (req.headers.get("authorization") || "").replace(
    /^Bearer\s+/i,
    "",
  );
  if (provided !== secret) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await connectToDatabase();

  const now = new Date();
  const BATCH_SIZE = 50;

  const due = await Subscription.find({
    status: "canceled",
    endsAt: { $ne: null, $lte: now },
  })
    .limit(BATCH_SIZE)
    .select("_id user providerSubscriptionId");

  let downgraded = 0;
  for (const sub of due) {
    try {
      // Only downgrade if the user STILL points at this subscription and is
      // still on a paid plan — they may have re-subscribed since cancelling.
      const res = await User.updateOne(
        {
          _id: sub.user,
          razorpaySubscriptionId: sub.providerSubscriptionId,
          plan: { $ne: "free" },
        },
        {
          $set: {
            plan: "free",
            planStatus: "active",
            planRenewsAt: null,
            razorpaySubscriptionId: "",
          },
        },
      );
      // Mark the subscription finalized so it isn't re-scanned next run.
      await Subscription.updateOne(
        { _id: sub._id },
        { $set: { status: "expired" } },
      );
      if (res.modifiedCount > 0) downgraded++;
    } catch (err: any) {
      console.error(
        `[cron-downgrade] failed for subscription ${sub._id}:`,
        err?.message ?? err,
      );
    }
  }

  return NextResponse.json({ ok: true, scanned: due.length, downgraded });
}
