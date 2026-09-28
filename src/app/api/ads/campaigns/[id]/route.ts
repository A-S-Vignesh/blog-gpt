import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { rateLimit } from "@/lib/rateLimit";
import AdCampaign from "@/models/AdCampaign";
import Ad from "@/models/Ad";
import { getCampaignDetail } from "@/lib/data/ads";
import { parseCampaignInput } from "@/lib/ads/validate";
import { getSlotAvailability } from "@/lib/ads/serve";
import { AD_PLACEMENTS, type AdPlacement } from "@/config/ads";

export const dynamic = "force-dynamic";

/**
 * Load a campaign the caller actually owns.
 *
 * Ownership is part of the QUERY, not a check afterwards — another user's id
 * simply doesn't match, so they get a 404 and learn nothing about whether the
 * campaign exists. Every handler in this file goes through here.
 */
async function ownedCampaign(campaignId: string, userId: string) {
  if (!Types.ObjectId.isValid(campaignId)) {
    throw new ApiError("NOT_FOUND", "Campaign not found.");
  }
  await connectToDatabase();
  const campaign = await AdCampaign.findOne({
    _id: campaignId,
    advertiser: userId,
  });
  if (!campaign) throw new ApiError("NOT_FOUND", "Campaign not found.");
  return campaign;
}

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?._id) {
    throw new ApiError("UNAUTHENTICATED", "Sign in required.");
  }
  return session.user._id;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireUser();
    const { id } = await params;
    const detail = await getCampaignDetail(userId, id);
    return NextResponse.json(detail);
  } catch (err) {
    return apiErrorResponse(err);
  }
}

/**
 * Advertiser-side campaign actions.
 *
 * Body: { action: "update" | "submit" | "pause" | "resume" | "archive", ... }
 *
 * The status machine is enforced here, not trusted from the client:
 *  - `update` only works while the campaign is a draft or was rejected —
 *    once it is in review or live, its price and dates are fixed, otherwise
 *    an advertiser could get cheap copy approved and then swap in anything.
 *  - `submit` requires at least one creative, re-checks that the placement is
 *    still free for those dates, and moves draft/rejected into pending_review.
 *  - `pause`/`resume` toggle only between active/approved and paused, so they
 *    can never be used to sidestep review.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireUser();
    const { id } = await params;

    const rl = await rateLimit({
      key: `ad-campaign-patch:${userId}`,
      windowMs: 60 * 1000,
      max: 60,
    });
    if (!rl.ok) {
      throw new ApiError("RATE_LIMITED", "Too many changes. Slow down a moment.", {
        retryAfterSeconds: rl.retryAfterSeconds,
      });
    }

    const campaign = await ownedCampaign(id, userId);
    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    switch (action) {
      case "update": {
        if (campaign.status !== "draft" && campaign.status !== "rejected") {
          throw new ApiError(
            "CONFLICT",
            "Only a draft or rejected campaign can be edited. Book a new one to change the placement or dates.",
          );
        }
        // Re-priced from the rate card on every edit — changing the placement
        // or the length changes what it costs, and the client never says so.
        Object.assign(campaign, parseCampaignInput(body));
        await campaign.save();
        break;
      }

      case "submit": {
        if (campaign.status !== "draft" && campaign.status !== "rejected") {
          throw new ApiError(
            "CONFLICT",
            "This campaign has already been submitted.",
          );
        }
        const creatives = await Ad.countDocuments({ campaign: campaign._id });
        if (creatives === 0) {
          throw new ApiError(
            "VALIDATION_FAILED",
            "Add at least one creative before submitting for review.",
          );
        }

        // Slot check, at the moment of committing rather than when the draft
        // was written. A draft can sit for a week while someone else books the
        // same fortnight, and letting both through would mean two advertisers
        // paying a full day rate for half a slot each. The builder shows
        // availability live, but this is what actually enforces it.
        const slot = await getSlotAvailability(
          campaign.placement,
          campaign.startDate,
          campaign.endDate,
          String(campaign._id),
        );
        if (!slot.isAvailable) {
          throw new ApiError(
            "CONFLICT",
            `The ${AD_PLACEMENTS[campaign.placement as AdPlacement]?.name ?? campaign.placement} slot is fully booked for those dates — all ${slot.capacity} spots are taken. Pick different dates or another placement, then submit again.`,
          );
        }

        campaign.status = "pending_review";
        campaign.submittedAt = new Date();
        campaign.reviewNote = "";
        await campaign.save();
        break;
      }

      case "pause": {
        if (campaign.status !== "active" && campaign.status !== "approved") {
          throw new ApiError("CONFLICT", "Only a live campaign can be paused.");
        }
        campaign.status = "paused";
        await campaign.save();
        break;
      }

      case "resume": {
        if (campaign.status !== "paused") {
          throw new ApiError("CONFLICT", "This campaign isn't paused.");
        }
        // Back to `approved`; the scheduler promotes it to active once the
        // start date is reached. Resuming never re-opens review.
        campaign.status = "approved";
        await campaign.save();
        break;
      }

      case "archive": {
        if (campaign.status === "active" || campaign.status === "pending_review") {
          throw new ApiError(
            "CONFLICT",
            "Pause the campaign (or wait for review) before archiving it.",
          );
        }
        campaign.status = "archived";
        await campaign.save();
        break;
      }

      default:
        throw new ApiError(
          "BAD_REQUEST",
          'action must be one of "update", "submit", "pause", "resume", or "archive".',
        );
    }

    return NextResponse.json({ ok: true, status: campaign.status });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

/** Delete a campaign that never ran. Anything paid or delivered is archived. */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireUser();
    const { id } = await params;
    const campaign = await ownedCampaign(id, userId);

    if (campaign.impressions > 0 || campaign.paymentStatus !== "unpaid") {
      throw new ApiError(
        "CONFLICT",
        "A campaign that has been paid for or delivered can't be deleted — archive it instead, so its billing record survives.",
      );
    }
    if (campaign.status === "pending_review") {
      throw new ApiError(
        "CONFLICT",
        "This campaign is in review. Wait for a decision first.",
      );
    }

    await Ad.deleteMany({ campaign: campaign._id });
    await AdCampaign.deleteOne({ _id: campaign._id });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
