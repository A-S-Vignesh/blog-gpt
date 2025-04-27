import NextAuth from "next-auth/next";
import GoogleProvider from "next-auth/providers/google";
import User from "@/db/models/user";
import { connectToDB } from "@/db/database";

const handler = NextAuth({
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
        //connect to database
        await connectToDB();
        //check for existing user
        const existUser = await User.findOne({ email: profile.email });
        //if there is no existing user create new user in db

        if (!existUser) {
          const username = profile.name.toLowerCase().replace(/\s/g, "");

          //check the username is already used or not
          const isValidUsername = await User.findOne({ username: username });
          //create a unique username
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
        // Ensure database connection
        await connectToDB();
        
        // Add a timeout to the database query
        const sessionUser = await Promise.race([
          User.findOne({ email: session.user.email }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database query timeout')), 5000)
          )
        ]);
        
        if (!sessionUser) {
          console.error("User not found in database for session:", session.user.email);
          return session;
        }
        
        session.user.id = sessionUser._id.toString();
        return session;
      } catch (error) {
        console.error("Session Error:", error);
        // Return the session even if there's an error, to prevent complete auth failure
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
});

export { handler as GET, handler as POST };
