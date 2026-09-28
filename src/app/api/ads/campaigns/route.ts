import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { rateLimit } from "@/lib/rateLimit";
import AdCampaign from "@/models/AdCampaign";
import Ad from "@/models/Ad";
import { listMyCampaigns } from "@/lib/data/ads";
import { parseCampaignInput, parseCreativeInput } from "@/lib/ads/validate";

export const dynamic = "force-dynamic";

const STATUSES = [
  "draft",
  "pending_review",
  "approved",
  "rejected",
  "active",
  "paused",
  "completed",
];

/** The signed-in advertiser's own campaigns. */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      throw new ApiError("UNAUTHENTICATED", "Sign in required.");
    }

    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const skip = parseInt(url.searchParams.get("skip") || "0", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);

    const page = await listMyCampaigns(session.user._id, {
      status: status && STATUSES.includes(status) ? status : undefined,
      skip: Number.isFinite(skip) ? skip : 0,
      limit: Number.isFinite(limit) ? limit : 20,
    });

    return NextResponse.json(page);
  } catch (err) {
    return apiErrorResponse(err);
  }
}

/**
 * Create a campaign together with its first creative.
 *
 * The campaign is always born as a `draft` with `paymentStatus: "unpaid"`,
 * whatever the request body says — status and payment are workflow state that
 * only the submit, review, and payment-verification routes may advance. An
 * advertiser cannot POST themselves a live, paid campaign.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      throw new ApiError("UNAUTHENTICATED", "Sign in required.");
    }

    const rl = await rateLimit({
      key: `ad-campaign-create:${session.user._id}`,
      windowMs: 60 * 60 * 1000,
      max: 20,
    });
    if (!rl.ok) {
      throw new ApiError(
        "RATE_LIMITED",
        "You're creating campaigns too quickly. Try again shortly.",
        { retryAfterSeconds: rl.retryAfterSeconds },
      );
    }

    const body = await req.json().catch(() => ({}));
    const campaignInput = parseCampaignInput(body);
    const creativeInput = parseCreativeInput(body?.creative ?? {});

    await connectToDatabase();

    const campaign = await AdCampaign.create({
      ...campaignInput,
      advertiser: session.user._id,
      contactEmail: campaignInput.contactEmail || session.user.email || "",
      status: "draft",
      paymentStatus: "unpaid",
    });

    await Ad.create({
      ...creativeInput,
      campaign: campaign._id,
      advertiser: session.user._id,
    });

    return NextResponse.json({ ok: true, id: String(campaign._id) });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
