import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import AdCampaign from "@/models/AdCampaign";
import { verifyOrderSignature } from "@/lib/payments/razorpay";
import { startClockOnPayment, syncCampaignSchedules } from "@/lib/ads/serve";

export const dynamic = "force-dynamic";

/**
 * Confirm a booking payment and put the campaign into rotation.
 *
 * Everything here is verified server-side. The browser tells us which payment
 * it completed, but the only thing that marks the campaign paid is Razorpay's
 * HMAC signature over `${orderId}|${paymentId}`, checked against our key
 * secret. A forged POST fails that check and changes nothing.
 *
 * The order id is additionally required to match the one WE stored when the
 * order was opened, so a signature from a genuine but unrelated payment (say a
 * $1 order the attacker made elsewhere) cannot be replayed to fund a
 * three-month article booking.
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

    const body = (await req.json().catch(() => null)) as {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    } | null;

    if (
      !body?.razorpay_order_id ||
      !body.razorpay_payment_id ||
      !body.razorpay_signature
    ) {
      throw new ApiError("BAD_REQUEST", "Missing Razorpay response fields.");
    }

    await connectToDatabase();
    const campaign = await AdCampaign.findOne({
      _id: id,
      advertiser: session.user._id,
    });
    if (!campaign) throw new ApiError("NOT_FOUND", "Campaign not found.");

    if (campaign.paymentStatus === "paid") {
      return NextResponse.json({ ok: true, alreadyPaid: true });
    }

    // The order must be the one we opened for THIS campaign.
    if (
      !campaign.paymentOrderId ||
      campaign.paymentOrderId !== body.razorpay_order_id
    ) {
      throw new ApiError(
        "FORBIDDEN",
        "That payment doesn't belong to this campaign.",
      );
    }

    const ok = verifyOrderSignature({
      orderId: body.razorpay_order_id,
      paymentId: body.razorpay_payment_id,
      signature: body.razorpay_signature,
    });
    if (!ok) {
      throw new ApiError(
        "FORBIDDEN",
        "Payment signature verification failed. The campaign was NOT activated.",
      );
    }

    campaign.paymentStatus = "paid";
    campaign.paymentId = body.razorpay_payment_id;
    campaign.paidAt = new Date();
    // Someone who booked seven days starting Monday and only got through
    // review and checkout on Wednesday paid for seven days, not five. Payment
    // is where the clock starts, so a window that has already begun slides
    // forward to today and keeps its full length.
    const shifted = startClockOnPayment(campaign);
    await campaign.save();

    // If the start date has already arrived, begin delivering immediately
    // rather than waiting for the next cron tick.
    await syncCampaignSchedules();

    return NextResponse.json({
      ok: true,
      startDate: campaign.startDate.toISOString(),
      endDate: campaign.endDate.toISOString(),
      rescheduled: shifted,
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
