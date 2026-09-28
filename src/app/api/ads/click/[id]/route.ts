import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import Ad from "@/models/Ad";
import { trackAdEvent } from "@/lib/ads/serve";

export const dynamic = "force-dynamic";

/**
 * Click-through: record the click, then redirect to the advertiser's page.
 *
 * Routing clicks through us (rather than linking straight out) is what lets us
 * count clicks at all, and keeps the destination out of the served payload.
 * Nothing is charged here — the booking was paid for up front — so a click is
 * purely a number on the advertiser's dashboard.
 *
 * The redirect target is re-read from the database and re-validated here, not
 * taken from the query string. An open redirect on our domain would be worth
 * real money to a phisher — `thebloggpt.com/api/ads/click/...` looks
 * trustworthy in a link preview — so the only reachable destinations are URLs
 * an admin has already approved, and the protocol is re-checked at the last
 * moment in case a creative predates the validator.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const home = new URL("/", req.url);

  try {
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.redirect(home);
    }

    await connectToDatabase();
    const ad = await Ad.findById(id).select("destinationUrl");
    if (!ad?.destinationUrl) {
      return NextResponse.redirect(home);
    }

    let target: URL;
    try {
      target = new URL(ad.destinationUrl);
    } catch {
      return NextResponse.redirect(home);
    }
    if (target.protocol !== "http:" && target.protocol !== "https:") {
      return NextResponse.redirect(home);
    }

    // Count first, redirect second — but never let a tracking failure strand
    // the reader on an error page instead of the advertiser's site.
    try {
      const session = await getServerSession(authOptions);
      await trackAdEvent(id, "click", req, session?.user?._id ?? null);
    } catch (err) {
      console.error("[ads] click tracking failed:", err);
    }

    return NextResponse.redirect(target.toString(), {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err) {
    console.error("[ads] click route failed:", err);
    return NextResponse.redirect(home);
  }
}
