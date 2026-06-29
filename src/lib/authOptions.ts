import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { generateUsername } from "@/utils/generateUsername";
import { sendEmail } from "@/lib/email/send";
import { welcomeEmail } from "@/lib/email/templates";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ profile }) {
      // Only the email is truly required. The display name can be in any
      // language and is sanitized below, so sign-in is NEVER blocked by the name.
      if (!profile?.email) return false;

      await connectToDatabase();

      let user = await User.findOne({ email: profile.email });

      let isNewUser = false;
      if (!user) {
        // Trim, cap at 100, and fall back to the email local-part so a missing,
        // odd, or over-long name can't fail validation and block the login.
        const safeName =
          (profile.name || profile.email.split("@")[0] || "User")
            .trim()
            .slice(0, 100) || "User";

        // Create the account, retrying on the rare unique-index race so a
        // concurrent sign-in can never block the login:
        //   - duplicate EMAIL  → another request just created this user; reuse it
        //   - duplicate USERNAME → regenerate a fresh handle and retry
        for (let attempt = 0; attempt < 3 && !user; attempt++) {
          try {
            const username = await generateUsername(profile.name || safeName);
            user = await User.create({
              email: profile.email,
              name: safeName,
              username,
              image: (profile as any).picture || "",
            });
            isNewUser = true;
          } catch (err: any) {
            if (err?.code === 11000) {
              const existing = await User.findOne({ email: profile.email });
              if (existing) {
                user = existing; // email race — use the doc that won
                break;
              }
              continue; // username collision — loop regenerates a new handle
            }
            throw err;
          }
        }

        // Fire-and-forget welcome email (only for genuinely new accounts).
        if (isNewUser && user) {
          const tpl = welcomeEmail({ name: safeName });
          void sendEmail({
            to: profile.email,
            subject: tpl.subject,
            html: tpl.html,
            tag: "welcome",
          }).catch((err) => console.error("[auth] welcome email failed:", err));
        }
      }

      // Could not load or create the account (e.g. repeated unique-index race).
      if (!user) return false;

      // Block sign-in for banned users / users mid-deletion.
      if (user.banned) return false;
      if (user.deletionScheduledFor) return false;

      return true;
    },

    async jwt({ token, user }) {
      if (user?.email) {
        // Initial sign-in: stamp identity onto the token.
        await connectToDatabase();
        const dbUser = await User.findOne({ email: user.email });

        if (dbUser) {
          token._id = dbUser._id.toString();
          token.username = dbUser.username;
          token.bannedCheckedAt = Date.now();
        }
        return token;
      }

      // On later requests, periodically re-validate that the account is still
      // active. Without this, a user banned (or who started account deletion)
      // AFTER sign-in keeps full write access until their JWT expires. We
      // re-check at most every 5 minutes to avoid a DB read on every request.
      const RECHECK_MS = 5 * 60 * 1000;
      const lastChecked = (token.bannedCheckedAt as number) || 0;
      if (token._id && Date.now() - lastChecked > RECHECK_MS) {
        await connectToDatabase();
        const dbUser = await User.findById(token._id).select(
          "banned deletionScheduledFor username",
        );
        if (!dbUser || dbUser.banned || dbUser.deletionScheduledFor) {
          // Invalidate the session — every protected route keys off token._id,
          // so clearing it locks the account out within the recheck window.
          const t = token as Record<string, unknown>;
          delete t._id;
          delete t.username;
        } else {
          token.username = dbUser.username;
          token.bannedCheckedAt = Date.now();
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user._id = token._id as string;
        session.user.username = token.username as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development",
};
