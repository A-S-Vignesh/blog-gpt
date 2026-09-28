import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import AdCampaign from "@/models/AdCampaign";
import Ad from "@/models/Ad";
import { parseCreativeInput } from "@/lib/ads/validate";

export const dynamic = "force-dynamic";

/** Hard cap so one campaign can't accumulate unbounded variants. */
const MAX_CREATIVES = 10;

/**
 * Add a creative to a campaign the caller owns.
 *
 * Adding a creative to an already-approved campaign puts the campaign BACK
 * into review. Without that, an advertiser could get a bland creative approved
 * and then attach anything they liked to the same booked slot — the review
 * would be meaningless.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      throw new ApiError("UNAUTHENTICATED", "Sign in required.");
    }
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError("NOT_FOUND", "Campaign not found.");
    }

    await connectToDatabase();
    const campaign = await AdCampaign.findOne({
      _id: id,
      advertiser: session.user._id,
    });
    if (!campaign) throw new ApiError("NOT_FOUND", "Campaign not found.");

    if (campaign.status === "completed" || campaign.status === "archived") {
      throw new ApiError(
        "CONFLICT",
        "This campaign has finished. Create a new one to run more creatives.",
      );
    }

    const count = await Ad.countDocuments({ campaign: campaign._id });
    if (count >= MAX_CREATIVES) {
      throw new ApiError(
        "CONFLICT",
        `A campaign can hold at most ${MAX_CREATIVES} creatives.`,
      );
    }

    const input = parseCreativeInput(await req.json().catch(() => ({})));
    const creative = await Ad.create({
      ...input,
      campaign: campaign._id,
      advertiser: session.user._id,
    });

    let requeued = false;
    if (
      campaign.status === "approved" ||
      campaign.status === "active" ||
      campaign.status === "paused"
    ) {
      campaign.status = "pending_review";
      campaign.submittedAt = new Date();
      campaign.reviewNote = "";
      await campaign.save();
      requeued = true;
    }

    return NextResponse.json({
      ok: true,
      id: String(creative._id),
      requeuedForReview: requeued,
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
