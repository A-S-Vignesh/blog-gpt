import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { connectToDatabase } from "@/lib/mongodb";
import {User} from "@/models/User";

// Utility to generate unique username
const generateUsername = async (name: string): Promise<string> => {
  const baseUsername = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with dashes
    .replace(/(^-|-$)/g, ""); // Trim starting/trailing dashes

  const isTaken = await User.findOne({ username: baseUsername });

  if (!isTaken) return baseUsername;

  const suffix = Math.random().toString(36).substring(2).slice(
    0,
    baseUsername.length >= 20
      ? 0
      : baseUsername.length > 16
      ? 20 - baseUsername.length
      : 4
  );

  return `${baseUsername}${suffix}`;
};

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

      try {
        await connectToDatabase();
        console.log("profile from login",profile)

        const existingUser = await User.findOne({ email: profile.email });
        console.log("ExistigUser", existingUser);

        if (!existingUser) {
          const username = await generateUsername(profile.name);

          await User.create({
            email: profile.email,
            name: profile.name,
            username,
            image: (profile as any).picture || "",
          });
          }

        return true;
      } catch (error) {
        console.error("❌ SignIn Error:", error);
        return false;
      }
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user._id = token._id as string;
        session.user.username = token.username as string;
      }
      return session;
    },

    async jwt({ token, user }) {
      if (user?.email) {
        await connectToDatabase();
        const dbUser = await User.findOne({ email: user.email });
        token._id = dbUser?._id?.toString() ?? "";
        token.username = dbUser?.username ?? "";
      }
      return token;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development",
};
