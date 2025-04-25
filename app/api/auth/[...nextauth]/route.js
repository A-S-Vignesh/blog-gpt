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
        console.log(error);
      }
    },
    async session({ session }) {
      const sesstionUser = await User.findOne({ email: session.user.email });
      session.user.id = sesstionUser._id.toString();
      session.callbackUrl = "/";
      return session;
    },
  },
});

export { handler as GET, handler as POST };
