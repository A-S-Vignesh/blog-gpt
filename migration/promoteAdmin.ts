import mongoose from "mongoose";
import { User } from "../src/models/User";

/**
 * Promote (or demote) an account's admin role.
 *
 * MongoDB is the single source of truth for authorization — there is no
 * hardcoded admin email anywhere in the app, and no env var that grants
 * privilege. This script is the one supported way to mint the first admin:
 *
 *   pnpm admin:promote asvicki2002@gmail.com
 *   pnpm admin:promote someone@example.com --role=user   # demote
 *   pnpm admin:promote --list                            # show admins
 *
 * Requires MONGODB_URI in the environment. The package.json script loads .env
 * and .env.local for you.
 */

const VALID_ROLES = ["admin", "author", "user"] as const;
type Role = (typeof VALID_ROLES)[number];

/** Escape a string for safe use inside a MongoDB $regex. */
function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function main() {
  const args = process.argv.slice(2);
  const listOnly = args.includes("--list");
  const roleArg = args.find((a) => a.startsWith("--role="));
  const role = (roleArg?.split("=")[1] || "admin") as Role;
  const email = args.find((a) => !a.startsWith("--"))?.trim().toLowerCase();

  if (!VALID_ROLES.includes(role)) {
    console.error(
      `Invalid role "${role}". Use one of: ${VALID_ROLES.join(", ")}`,
    );
    process.exit(1);
  }
  if (!listOnly && !email) {
    console.error(
      "Usage: pnpm admin:promote <email> [--role=admin|author|user]",
    );
    console.error("       pnpm admin:promote --list");
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set. Check your .env file.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB\n");

  try {
    if (listOnly) {
      const admins = await User.find({ role: "admin" })
        .select("email username")
        .lean<{ email: string; username: string }[]>();
      if (admins.length === 0) {
        console.log("No admin accounts exist yet.");
      } else {
        console.log(`Current admins (${admins.length}):`);
        for (const a of admins) {
          console.log(`  - ${a.email}  (@${a.username})`);
        }
      }
      return;
    }

    // Email is stored as Google supplied it, so match case-insensitively
    // rather than assuming it was lowercased on write.
    const user = await User.findOne({
      email: { $regex: `^${escapeRegex(email as string)}$`, $options: "i" },
    });

    if (!user) {
      console.error(`No account found for ${email}.`);
      console.error("The user must sign in with Google at least once first.");
      process.exit(1);
    }

    if (user.role === role) {
      console.log(
        `${user.email} (@${user.username}) is already "${role}". Nothing to do.`,
      );
      return;
    }

    const previous = user.role;
    user.role = role;
    await user.save();

    console.log(`${user.email} (@${user.username}): ${previous} -> ${role}`);
    if (role === "admin") {
      console.log("");
      console.log("Open /admin after signing in. If you are already signed in,");
      console.log("the role reaches your session within ~5 minutes, or");
      console.log("immediately if you sign out and back in.");
    }
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
