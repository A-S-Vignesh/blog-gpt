import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { rateLimit } from "@/lib/rateLimit";
import AdCampaign from "@/models/AdCampaign";
import {
  getRazorpayClient,
  getRazorpayPublicKey,
  isPaymentsEnabled,
} from "@/lib/payments/razorpay";

export const dynamic = "force-dynamic";

/**
 * Open a Razorpay order for a campaign's booking price.
 *
 * Only an APPROVED campaign can be paid. Taking money before review would mean
 * refunding every rejected campaign; taking it after approval means we only
 * ever hold money for inventory we have agreed to run.
 *
 * The charged amount is `priceCents` as stored on the campaign — set by the
 * server from the rate card when the campaign was created, never sent by the
 * browser. A crafted request has nothing to tamper with: it can only ask to
 * pay for a campaign, not to say what that campaign costs.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!isPaymentsEnabled()) {
      throw new ApiError(
        "FORBIDDEN",
        "Card payments aren't switched on yet. We'll invoice you directly — reply to your approval email.",
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      throw new ApiError("UNAUTHENTICATED", "Sign in required.");
    }
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError("NOT_FOUND", "Campaign not found.");
    }

    const rl = await rateLimit({
      key: `ad-pay:${session.user._id}`,
      windowMs: 60 * 1000,
      max: 10,
    });
    if (!rl.ok) {
      throw new ApiError("RATE_LIMITED", "Too many checkout attempts.", {
        retryAfterSeconds: rl.retryAfterSeconds,
      });
    }

    await connectToDatabase();
    const campaign = await AdCampaign.findOne({
      _id: id,
      advertiser: session.user._id,
    });
    if (!campaign) throw new ApiError("NOT_FOUND", "Campaign not found.");

    if (campaign.paymentStatus === "paid") {
      throw new ApiError("CONFLICT", "This campaign is already paid for.");
    }
    if (campaign.status !== "approved") {
      throw new ApiError(
        "CONFLICT",
        "You can pay once the campaign has been approved. We'll email you when it is.",
      );
    }

    const client = getRazorpayClient();
    const order = await client.orders.create({
      amount: campaign.priceCents, // integer minor units — our stored cents
      currency: "USD",
      receipt: `adcmp_${String(campaign._id)}`,
      notes: {
        campaignId: String(campaign._id),
        advertiserId: String(session.user._id),
      },
    });

    campaign.paymentOrderId = order.id;
    await campaign.save();

    return NextResponse.json({
      orderId: order.id,
      amount: campaign.priceCents,
      currency: "USD",
      keyId: getRazorpayPublicKey(),
      campaignName: campaign.name,
      days: campaign.days,
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
