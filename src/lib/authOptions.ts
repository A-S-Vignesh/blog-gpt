import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { generateUsername } from "@/utils/generateUsername";

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
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user?.email) {
        await connectToDatabase();
        const dbUser = await User.findOne({ email: user.email });

        if (dbUser) {
          token._id = dbUser._id.toString();
          token.username = dbUser.username;
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
