import { NextResponse } from "next/server";
import { syncCampaignSchedules } from "@/lib/ads/serve";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cron: move ad campaigns through the time-driven parts of the workflow.
 *
 *   approved + paid + start date reached -> active
 *   approved/active + end date passed    -> completed
 *
 * Scheduled hourly by the server cron in deploy/oracle/thebloggpt.cron
 * (see docs/DEPLOY-ORACLE.md).
 *
 * Protected by CRON_SECRET, the same bearer scheme the other cron routes use.
 * The system stays correct without this job — serving re-checks dates on every
 * request, and payment verification syncs on the spot — but statuses would go
 * stale in both dashboards, so a campaign that had ended would still read
 * "active" until someone touched it.
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

  const result = await syncCampaignSchedules();
  return NextResponse.json({ ok: true, ...result });
}
