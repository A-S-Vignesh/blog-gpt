import mongoose from "mongoose";
import { User } from "../src/models/User";
import { encryptSecret, isEncrypted } from "../src/lib/crypto/secretBox";

/**
 * One-time migration: encrypt any legacy PLAINTEXT Gemini API keys at rest.
 *
 * Idempotent — keys already in the `enc:v1` format are skipped. New keys set via
 * the app are encrypted on save, so this only heals pre-existing plaintext rows.
 *
 * IMPORTANT: run with the SAME `NEXTAUTH_SECRET` (or `ENCRYPTION_KEY`) the app
 * uses in production, or the encrypted values won't decrypt there.
 *
 *   DRY_RUN=1 npm run migrate:encrypt-keys   # preview
 *   npm run migrate:encrypt-keys             # apply
 */

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/blog";
const DRY_RUN = process.env.DRY_RUN === "1" || process.argv.includes("--dry");

async function run() {
  if (!process.env.NEXTAUTH_SECRET && !process.env.ENCRYPTION_KEY) {
    console.error(
      "❌ Set NEXTAUTH_SECRET (or ENCRYPTION_KEY) to the SAME value the app uses, " +
        "otherwise the encrypted keys won't decrypt in production.",
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`✅ Connected${DRY_RUN ? "  (DRY RUN — no writes)" : ""}\n`);

    const users = await User.find({
      geminiApiKey: { $exists: true, $nin: [null, ""] },
    })
      .select("_id email geminiApiKey")
      .lean<any[]>();

    let encrypted = 0;
    let already = 0;

    for (const u of users) {
      const key = u.geminiApiKey as string;
      if (isEncrypted(key)) {
        already++;
        continue;
      }
      if (!DRY_RUN) {
        await User.updateOne(
          { _id: u._id },
          { $set: { geminiApiKey: encryptSecret(key) } },
          { timestamps: false },
        );
      }
      encrypted++;
      console.log(
        `  ${DRY_RUN ? "[dry] would encrypt" : "✔ encrypted"} @${u.email}`,
      );
    }

    console.log(
      `\n${DRY_RUN ? "🔎 Dry run complete" : "🎉 Done"} · ` +
        `${encrypted} ${DRY_RUN ? "would be " : ""}encrypted · ${already} already encrypted`,
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
