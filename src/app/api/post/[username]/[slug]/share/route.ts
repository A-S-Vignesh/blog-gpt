import { createHash } from "node:crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import Post from "@/models/Post";
import Share from "@/models/Share";
import { NextResponse } from "next/server";
import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { revalidateTag } from "next/cache";
import { postDetailTag } from "@/lib/data/posts";
import { isShareChannel, type ShareChannel } from "@/lib/share";

/**
 * Anonymous shares are tracked for ~30 days. After that, the same hash can
 * count again — graceful degradation for CGNAT/shared-IP environments where
 * a permanent lock would unfairly block real users.
 */
const ANON_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Record a share event with strong counter-inflation defense.
 *
 * Layers:
 *   1) Idempotency (the real gate): a unique compound index on
 *      (identity, post, channel) means the same person sharing the same post
 *      on the same channel can never increment the counter twice.
 *   2) Rate limit (defense-in-depth): caps write volume from a single IP
 *      enumerating posts/channels; duplicate-key writes still cost a DB
 *      round-trip we don't want spammed.
 *
 * "Identity" is:
 *   - `u:<userId>` for logged-in users  → permanent
 *   - `a:<sha256(ip|userAgent)>` for anonymous → 30-day TTL
 *
 * Fake-share resistance: a single logged-in user clicking "Share to Twitter"
 * 50 times produces exactly one Share row and one counter increment.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ username: string; slug: string }> },
) {
  try {
    const { username, slug } = await params;

    const body = (await req.json().catch(() => null)) as {
      channel?: string;
    } | null;
    if (!body || !isShareChannel(body.channel)) {
      throw new ApiError("BAD_REQUEST", "Missing or invalid `channel`.");
    }
    const channel = body.channel as ShareChannel;

    // Broad per-IP write throttle — protects DB load when someone scripts
    // share enumeration across many posts. Generous because duplicate clicks
    // are no-ops at the integrity layer anyway.
    const ip = getClientIp(req);
    const rl = await rateLimit({
      key: `share:${ip}`,
      windowMs: 60 * 1000,
      max: 30,
    });
    if (!rl.ok) {
      // Silent skip — never make a user's share button "fail" because of
      // rate limiting; we just don't record the event.
      return NextResponse.json({ success: true, counted: false });
    }

    await connectToDatabase();

    // Validate the (username, slug) pair matches a real post.
    const post = await Post.findOne({ slug })
      .populate("creator", "username")
      .select("_id creator sharesCount");
    if (
      !post ||
      (post.creator as any).username?.toLowerCase() !== username.toLowerCase()
    ) {
      throw new ApiError("NOT_FOUND", "Post not found.");
    }

    // Resolve identity. Logged-in identity is stable forever; anonymous is
    // a salted hash so we can't accidentally log raw IPs.
    const session = await getServerSession(authOptions);
    let identity: string;
    let expiresAt: Date | null = null;
    if (session?.user?._id) {
      identity = `u:${session.user._id}`;
    } else {
      const ua = req.headers.get("user-agent") ?? "";
      const hash = createHash("sha256")
        .update(`${ip}|${ua}`)
        .digest("hex")
        .slice(0, 32);
      identity = `a:${hash}`;
      expiresAt = new Date(Date.now() + ANON_TTL_MS);
    }

    // The integrity gate: try to insert the uniqueness row. E11000 means
    // this (identity, post, channel) already shared → we DO NOT increment.
    try {
      await Share.create({
        post: post._id,
        identity,
        channel,
        expiresAt,
      });
    } catch (err: any) {
      if (err?.code === 11000) {
        return NextResponse.json({
          success: true,
          counted: false,
          sharesCount: post.sharesCount ?? 0,
        });
      }
      throw err;
    }

    // First share for this identity+post+channel — bump both counters.
    // Dotted-path $inc into the Map field is atomic and avoids a load-modify-
    // save race on `sharesByChannel`.
    const updated = await Post.findByIdAndUpdate(
      post._id,
      {
        $inc: {
          sharesCount: 1,
          [`sharesByChannel.${channel}`]: 1,
        },
      },
      { new: true },
    )
      .select("sharesCount")
      .lean<{ sharesCount?: number }>();

    revalidateTag(postDetailTag(slug), "default");

    return NextResponse.json({
      success: true,
      counted: true,
      sharesCount: updated?.sharesCount ?? 0,
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
