import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api/errors";
import { pickAd } from "@/lib/ads/serve";
import { AD_PLACEMENTS, type AdPlacement } from "@/config/ads";

export const dynamic = "force-dynamic";

/**
 * Return one creative to render in a placement, or `{ ad: null }`.
 *
 * Public and unauthenticated — readers are the audience. It returns only the
 * fields needed to draw the card: no advertiser identity, no commercial terms,
 * and crucially no destinationUrl. Clicks route through /api/ads/click/[id]
 * instead, so the outbound link cannot be harvested from the feed without a
 * recorded click.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const raw = url.searchParams.get("placement") || "";
    const placement = (
      raw in AD_PLACEMENTS ? raw : "sidebar"
    ) as AdPlacement;

    const ad = await pickAd(placement);

    // Never cache: the whole point is rotation between viewers, and a cached
    // response would also skew impression counts.
    return NextResponse.json(
      { ad },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (err) {
    return apiErrorResponse(err);
  }
}
