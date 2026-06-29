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
      if (!profile?.email || !profile?.name) return false;

      await connectToDatabase();

      let user = await User.findOne({ email: profile.email });

      if (!user) {
        const username = await generateUsername(profile.name);
        user = await User.create({
          email: profile.email,
          name: profile.name,
          username,
          image: (profile as any).picture || "",
        });

        // Fire-and-forget welcome email. Failures must not block sign-in.
        const tpl = welcomeEmail({ name: profile.name });
        void sendEmail({
          to: profile.email,
          subject: tpl.subject,
          html: tpl.html,
          tag: "welcome",
        }).catch((err) => console.error("[auth] welcome email failed:", err));
      }

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
