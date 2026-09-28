import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { rateLimit } from "@/lib/rateLimit";
import { getSlotAvailability } from "@/lib/ads/serve";
import {
  AD_PLACEMENTS,
  MAX_CAMPAIGN_DAYS,
  MIN_CAMPAIGN_DAYS,
  endDateFor,
  utcMidnight,
  type AdPlacement,
} from "@/config/ads";

export const dynamic = "force-dynamic";

/**
 * Is this placement free for these dates?
 *
 * The campaign builder calls this as the advertiser changes placement, start
 * date, or length, so a fully-booked fortnight is visible while they are still
 * choosing rather than as a rejection after they have written their copy.
 *
 * This is advisory only. The binding checks are in the submit and approve
 * handlers, which re-count at the moment the booking is actually committed —
 * an answer given here can be stale by the time anyone acts on it.
 *
 * Sign-in is required because slot occupancy is commercial information: an
 * open endpoint would let anyone map how much inventory we are selling and
 * when. Rate-limited for the same reason.
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      throw new ApiError("UNAUTHENTICATED", "Sign in required.");
    }

    const rl = await rateLimit({
      key: `ad-availability:${session.user._id}`,
      windowMs: 60 * 1000,
      max: 60,
    });
    if (!rl.ok) {
      throw new ApiError("RATE_LIMITED", "Too many checks. Slow down a moment.", {
        retryAfterSeconds: rl.retryAfterSeconds,
      });
    }

    const url = new URL(req.url);
    const placement = url.searchParams.get("placement") ?? "";
    if (!(placement in AD_PLACEMENTS)) {
      throw new ApiError("VALIDATION_FAILED", "Unknown placement.");
    }

    const days = Number(url.searchParams.get("days"));
    if (
      !Number.isInteger(days) ||
      days < MIN_CAMPAIGN_DAYS ||
      days > MAX_CAMPAIGN_DAYS
    ) {
      throw new ApiError("VALIDATION_FAILED", "Invalid number of days.");
    }

    const rawStart = new Date(url.searchParams.get("startDate") ?? "");
    if (Number.isNaN(rawStart.getTime())) {
      throw new ApiError("VALIDATION_FAILED", "Invalid start date.");
    }

    // Snapped the same way parseCampaignInput() snaps it, so the window quoted
    // here is exactly the window that will be booked.
    const startDate = utcMidnight(rawStart);
    const endDate = endDateFor(startDate, days);

    // A campaign being edited shouldn't count against itself.
    const exclude = url.searchParams.get("exclude");

    const slot = await getSlotAvailability(
      placement as AdPlacement,
      startDate,
      endDate,
      exclude,
    );

    return NextResponse.json({
      ...slot,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
