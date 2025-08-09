// lib/authOptions.js
import GoogleProvider from "next-auth/providers/google";
import User from "@/db/models/user";
import { connectToDB } from "@/db/database";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ profile }) {
      try {
        await connectToDB();
        const existUser = await User.findOne({ email: profile.email });

        if (!existUser) {
          const baseUsername = profile.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanum with dashes
            .replace(/(^-|-$)/g, ""); // Trim starting/trailing dashes

          const isValidUsername = await User.findOne({
            username: baseUsername,
          });

          const uniqueUsername =
            baseUsername +
            Math.random()
              .toString(36)
              .substring(2)
              .slice(
                0,
                baseUsername.length >= 20
                  ? 0
                  : baseUsername.length > 16
                  ? 20 - baseUsername.length
                  : 4
              );

          await User.create({
            email: profile.email,
            name: profile.name,
            username: !isValidUsername ? baseUsername : uniqueUsername,
            image: profile.picture,
          });
        }

        return true;
      } catch (error) {
        console.error("SignIn Error:", error);
        return false;
      }
    },

    async session({ session, token }) {
      if (token) {
        session.user._id = token._id;
        session.user.username = token.username;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        // Fetch user from DB using email to get _id and username
        const dbUser = await User.findOne({ email: user.email });

        token._id = dbUser?._id?.toString();
        token.username = dbUser?.username;
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
