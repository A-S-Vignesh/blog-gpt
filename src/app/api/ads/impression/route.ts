import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { apiErrorResponse } from "@/lib/api/errors";
import { trackAdEvent } from "@/lib/ads/serve";

export const dynamic = "force-dynamic";

/**
 * Record an impression.
 *
 * Deliberately always answers 200 `{ ok: true }`, whatever happened inside.
 * The caller is a fire-and-forget beacon in a reader's browser: it cannot act
 * on an error, and reporting "duplicate" vs "counted" back would hand anyone a
 * free oracle for probing which creatives are live and how dedup is windowed.
 * Real failures are logged server-side.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const adId = typeof body?.adId === "string" ? body.adId : "";
    if (!adId) return NextResponse.json({ ok: true });

    const session = await getServerSession(authOptions);
    await trackAdEvent(adId, "impression", req, session?.user?._id ?? null);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[ads] impression tracking failed:", err);
    // Still 200 — a tracking outage must never surface as an error in the feed.
    return NextResponse.json({ ok: true });
  }
}
