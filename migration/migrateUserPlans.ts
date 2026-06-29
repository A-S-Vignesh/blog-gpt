import mongoose from "mongoose";
import { User } from "../src/models/User";
import Post from "../src/models/Post";

// ─── Config ─────────────────────────────────────────────────────────────────
// Change this to your actual Atlas URI if running against production
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/blog";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Strip HTML tags and decode common HTML entities to get plain text. */
function toPlainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Average reading speed: 200 wpm, minimum 1 minute. */
function calcReadingTime(plainText: string): number {
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(wordCount / 200));
}

// ─── Migrations ─────────────────────────────────────────────────────────────

async function migrateUserPlans(): Promise<number> {
  const users = await User.find({}).lean();
  let updated = 0;

  for (const user of users) {
    const updateFields: Record<string, any> = {};

    if (!("plan" in user)) updateFields.plan = "free";
    if (!("planStatus" in user)) updateFields.planStatus = "active";
    if (!("aiGenerationCount" in user)) updateFields.aiGenerationCount = 0;
    if (!("aiExtraCredits" in user)) updateFields.aiExtraCredits = 0;
    if (!("aiUsagePeriodStart" in user))
      updateFields.aiUsagePeriodStart = new Date();

    if (Object.keys(updateFields).length > 0) {
      await User.updateOne({ _id: user._id }, { $set: updateFields });
      updated++;
      console.log(`  ✔ User fixed: ${user.email}`);
    }
  }

  return updated;
}

async function migratePostReadingTimeAndStatus(): Promise<{
  rtFixed: number;
  statusFixed: number;
}> {
  // Fetch all posts (including drafts so we can publish them too)
  const posts = await Post.find({}).select("content readingTime status").lean();

  let rtFixed = 0;
  let statusFixed = 0;

  for (const post of posts as any[]) {
    const updateFields: Record<string, any> = {};

    // ── Reading time ────────────────────────────────────────────────────────
    const plain = toPlainText(post.content || "");
    const correctRT = calcReadingTime(plain);

    if (!post.readingTime || post.readingTime !== correctRT) {
      updateFields.readingTime = correctRT;
      rtFixed++;
    }

    // ── Status ──────────────────────────────────────────────────────────────
    if (post.status !== "published") {
      updateFields.status = "published";
      statusFixed++;
    }

    if (Object.keys(updateFields).length > 0) {
      await Post.updateOne({ _id: post._id }, { $set: updateFields });
      console.log(
        `  ✔ Post [${String(post._id)}] → readingTime=${correctRT} min | status=${updateFields.status ?? post.status}`,
      );
    }
  }

  return { rtFixed, statusFixed };
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function runMigrations() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // 1. User plan migration (original)
    console.log("── [1/2] Migrating user plans ──────────────────────────────");
    const usersFixed = await migrateUserPlans();
    console.log(`   Total users fixed: ${usersFixed}\n`);

    // 2. Post reading time + status migration
    console.log("── [2/2] Migrating post readingTime & status ───────────────");
    const { rtFixed, statusFixed } = await migratePostReadingTimeAndStatus();
    console.log(`   Reading time recalculated: ${rtFixed}`);
    console.log(`   Status set to published:   ${statusFixed}\n`);

    console.log("🎉 All migrations completed successfully!");
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

runMigrations();
