import mongoose from "mongoose";
import Post from "../src/models/Post";

/**
 * One-time migration: backfill `readingTime` for legacy posts that have it
 * missing or 0.
 *
 * The create/edit routes compute `Math.max(1, round(words / 200))`, so new and
 * edited posts already have a sane value. This heals older rows that were
 * created before that clamp existed and currently render "0 min read".
 *
 * Writes use { timestamps: false } so the backfill never bumps `updatedAt`
 * (feeds sort by the immutable `date`, but we keep the invariant anyway).
 *
 *   DRY_RUN=1 npm run migrate:reading-time   # preview
 *   npm run migrate:reading-time             # apply
 */

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/blog";
const DRY_RUN = process.env.DRY_RUN === "1" || process.argv.includes("--dry");

function computeReadingTime(html: string): number {
  const words = (html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`✅ Connected${DRY_RUN ? "  (DRY RUN — no writes)" : ""}\n`);

    const posts = await Post.find({
      $or: [{ readingTime: { $exists: false } }, { readingTime: { $lte: 0 } }],
    })
      .select("_id slug content readingTime")
      .lean<any[]>();

    let fixed = 0;

    for (const p of posts) {
      const next = computeReadingTime(p.content as string);
      if (!DRY_RUN) {
        await Post.updateOne(
          { _id: p._id },
          { $set: { readingTime: next } },
          { timestamps: false },
        );
      }
      fixed++;
      console.log(
        `  ${DRY_RUN ? "[dry] would set" : "✔ set"} ${p.slug} → ${next} min ` +
          `(was ${p.readingTime ?? "missing"})`,
      );
    }

    console.log(
      `\n${DRY_RUN ? "🔎 Dry run complete" : "🎉 Done"} · ` +
        `${fixed} post${fixed === 1 ? "" : "s"} ${DRY_RUN ? "would be " : ""}fixed`,
    );
  } catch (err) {
    console.error("❌ Failed:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected");
  }
}

run();
