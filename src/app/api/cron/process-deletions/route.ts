import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { executeUserDeletion } from "@/lib/account/executeDeletion";

export const runtime = "nodejs";
// We never want this cached.
export const dynamic = "force-dynamic";

/**
 * Cron-triggered processor for accounts whose grace period has elapsed.
 *
 * Configure as a Vercel Cron in vercel.json:
 *   {
 *     "crons": [{ "path": "/api/cron/process-deletions", "schedule": "0 * * * *" }]
 *   }
 *
 * Protected by a shared bearer token in CRON_SECRET so external traffic
 * cannot trigger deletion runs.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return new NextResponse("Cron not configured", { status: 503 });
  }
  const authHeader = req.headers.get("authorization") || "";
  const provided = authHeader.replace(/^Bearer\s+/i, "");
  if (provided !== secret) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await connectToDatabase();

  // Process up to BATCH_SIZE due deletions per run so a backlog can drain
  // over several invocations without timing out.
  const BATCH_SIZE = 25;
  const now = new Date();

  const due = await User.find({
    deletionScheduledFor: { $lte: now, $ne: null },
  })
    .limit(BATCH_SIZE)
    .select("_id email");

  if (due.length === 0) {
    return NextResponse.json({ ok: true, processed: 0 });
  }

  const results: Array<{ userId: string; result: any }> = [];
  for (const u of due) {
    try {
      const r = await executeUserDeletion(u._id.toString());
      results.push({ userId: u._id.toString(), result: r });
    } catch (err: any) {
      console.error(
        `[cron-deletion] failed for user ${u._id}:`,
        err?.message ?? err,
      );
      results.push({
        userId: u._id.toString(),
        result: { failures: [err?.message ?? "unknown"] },
      });
    }
  }

  return NextResponse.json({
    ok: true,
    processed: results.length,
    results,
  });
}
