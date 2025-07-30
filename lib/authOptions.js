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
          const username = profile.name.toLowerCase().replace(/\s/g, "");
          const isValidUsername = await User.findOne({ username });
          const uniqueUsername =
            username +
            Math.random()
              .toString(36)
              .substring(2)
              .slice(
                0,
                username.length >= 20
                  ? 0
                  : username.length > 16
                  ? 20 - username.length
                  : 4
              );

          await User.create({
            email: profile.email,
            username: !isValidUsername ? username : uniqueUsername,
            image: profile.picture,
          });
        }
        return true;
      } catch (error) {
        console.error("SignIn Error:", error);
        return false;
      }
    },
    async session({ session }) {
      try {
        await connectToDB();
        const sessionUser = await Promise.race([
          User.findOne({ email: session.user.email }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("DB timeout")), 5000)
          ),
        ]);

        if (!sessionUser) return session;

        session.user._id = sessionUser._id.toString();
        return session;
      } catch (error) {
        console.error("Session Error:", error);
        return session;
      }
    },
    async jwt({ token, user, account }) {
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
        };
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
