import mongoose from "mongoose";

/**
 * One-off migration: switch the `username` unique index from case-SENSITIVE
 * (the old field-level `unique: true` → `username_1`) to case-INSENSITIVE
 * (a collation index). Run once after deploying the case-preserving username
 * change:
 *
 *   tsx migrateUsernameIndex.ts          (MONGODB_URI must be set in the env)
 *
 * Safe to re-run. It works on the raw `users` collection so it doesn't trigger
 * Mongoose autoIndex before the old index is dropped.
 *
 * NOTE: createIndex will fail if two existing usernames collide case-
 * insensitively (e.g. "bob" and "Bob"). Current data is single-cased, so this
 * won't happen — but if it ever does, resolve the duplicates first.
 */
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/blog";

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    const users = mongoose.connection.collection("users");

    // 1. Drop the old case-sensitive unique index, if it exists.
    try {
      await users.dropIndex("username_1");
      console.log("🗑️  Dropped old case-sensitive index: username_1");
    } catch (err: any) {
      if (err?.code === 27 || /index not found/i.test(err?.message ?? "")) {
        console.log("ℹ️  No username_1 index to drop (already gone).");
      } else {
        throw err;
      }
    }

    // 2. Create the case-insensitive unique index.
    await users.createIndex(
      { username: 1 },
      {
        unique: true,
        collation: { locale: "en", strength: 2 },
        name: "username_ci_unique",
      },
    );
    console.log("✅ Created case-insensitive unique index: username_ci_unique");

    console.log("\n🎉 Username index migration complete!");
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

run();
