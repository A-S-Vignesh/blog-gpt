import mongoose from "mongoose";
import { User } from "../src/models/User";
import Follow from "../src/models/Follow";
import Like from "../src/models/Like";
import Bookmark from "../src/models/Bookmark";

/**
 * One-time backfill that heals LEGACY user documents to the current schema.
 *
 * What it fixes (all idempotent — safe to run repeatedly):
 *   1. Migrates legacy embedded `followers/following/likes/bookmarks` ARRAYS
 *      into the Follow / Like / Bookmark collections (the current source of
 *      truth), then unsets the dead arrays.
 *   2. Recomputes the denormalized counters (followersCount, followingCount,
 *      bookmarksCount) from those collections.
 *   3. Fills a missing `name` from the username (post cards render creator.name
 *      with no fallback, so a blank name shows an empty author).
 *   4. Fills a missing `createdAt` from the ObjectId's embedded timestamp (the
 *      real creation time).
 *   5. Fills missing schema defaults (role, isActive, emailVerified, bio,
 *      website, geminiApiKey, socials).
 *
 * Run a DRY RUN first to see what it WOULD change:
 *   DRY_RUN=1 npm run migrate:backfill-users
 * Then for real:
 *   npm run migrate:backfill-users
 */

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/blog";
const DRY_RUN = process.env.DRY_RUN === "1" || process.argv.includes("--dry");

/** Readable display name from a username: "ishwar-rathod" → "Ishwar Rathod".
 *  Strips digits/symbols so it satisfies the name validator (letters/space/-). */
function humanizeUsername(username: string): string {
  const base = (username || "")
    .replace(/[0-9]+/g, " ")
    .replace(/[-_]+/g, " ")
    .replace(/[^a-zA-Z\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const titled = base.replace(/\b\w/g, (c) => c.toUpperCase());
  return titled || "User";
}

/** Move any legacy embedded relation arrays into the real collections. */
async function migrateLegacyRelations(user: any): Promise<number> {
  const upserts: Array<{ model: any; filter: any }> = [];

  for (const f of Array.isArray(user.followers) ? user.followers : []) {
    upserts.push({ model: Follow, filter: { follower: f, following: user._id } });
  }
  for (const f of Array.isArray(user.following) ? user.following : []) {
    upserts.push({ model: Follow, filter: { follower: user._id, following: f } });
  }
  for (const p of Array.isArray(user.likes) ? user.likes : []) {
    upserts.push({ model: Like, filter: { user: user._id, post: p } });
  }
  for (const p of Array.isArray(user.bookmarks) ? user.bookmarks : []) {
    upserts.push({ model: Bookmark, filter: { user: user._id, post: p } });
  }

  if (DRY_RUN) return upserts.length;

  for (const { model, filter } of upserts) {
    try {
      await model.updateOne(filter, { $setOnInsert: filter }, { upsert: true });
    } catch {
      // Duplicate key = already migrated. Ignore.
    }
  }
  return upserts.length;
}

async function backfillUsers() {
  const users = await User.find({}).lean<any[]>();
  let fixed = 0;
  let relationsMoved = 0;

  for (const user of users) {
    const set: Record<string, any> = {};
    const unset: Record<string, any> = {};

    // 1 + 2. Migrate legacy arrays, then drop them.
    relationsMoved += await migrateLegacyRelations(user);
    for (const k of ["followers", "following", "likes", "bookmarks"]) {
      if (k in user) unset[k] = "";
    }

    // 2. Recompute counters from the collections (source of truth).
    const [followersCount, followingCount, bookmarksCount] = await Promise.all([
      Follow.countDocuments({ following: user._id }),
      Follow.countDocuments({ follower: user._id }),
      Bookmark.countDocuments({ user: user._id }),
    ]);
    if (user.followersCount !== followersCount) set.followersCount = followersCount;
    if (user.followingCount !== followingCount) set.followingCount = followingCount;
    if (user.bookmarksCount !== bookmarksCount) set.bookmarksCount = bookmarksCount;

    // 3. Name (no UI fallback on post cards) — derive from username.
    if (typeof user.name !== "string" || !user.name.trim()) {
      set.name = humanizeUsername(user.username);
    }

    // 4. createdAt from the ObjectId timestamp.
    if (!user.createdAt) set.createdAt = user._id.getTimestamp();

    // 5. Schema defaults for anything missing.
    if (!("role" in user)) set.role = "user";
    if (!("isActive" in user)) set.isActive = true;
    if (!("emailVerified" in user)) set.emailVerified = false;
    if (!("bio" in user)) set.bio = "";
    if (!("website" in user)) set.website = "";
    if (!("geminiApiKey" in user)) set.geminiApiKey = "";
    if (!user.socials || typeof user.socials !== "object") {
      set.socials = { twitter: "", linkedin: "", github: "" };
    }

    if (Object.keys(set).length || Object.keys(unset).length) {
      const update: Record<string, any> = {};
      if (Object.keys(set).length) update.$set = set;
      if (Object.keys(unset).length) update.$unset = unset;

      if (!DRY_RUN) {
        // timestamps:false so we don't stamp every legacy account as "updated now".
        await User.updateOne({ _id: user._id }, update, { timestamps: false });
      }
      fixed++;
      console.log(
        `  ${DRY_RUN ? "[dry] would fix" : "✔ fixed"} @${user.username || user.email}` +
          (Object.keys(set).length ? ` · set: ${Object.keys(set).join(", ")}` : "") +
          (Object.keys(unset).length ? ` · unset: ${Object.keys(unset).join(", ")}` : ""),
      );
    }
  }

  return { total: users.length, fixed, relationsMoved };
}

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`✅ Connected${DRY_RUN ? "  (DRY RUN — no writes)" : ""}\n`);

    const { total, fixed, relationsMoved } = await backfillUsers();

    console.log(
      `\n${DRY_RUN ? "🔎 Dry run complete" : "🎉 Backfill complete"} · ` +
        `${fixed}/${total} users ${DRY_RUN ? "would be" : ""} fixed · ` +
        `${relationsMoved} legacy relations ${DRY_RUN ? "would be" : ""} migrated`,
    );
  } catch (err) {
    console.error("❌ Backfill failed:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected");
  }
}

run();
