import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      _id: string;
      username: string;
      /**
       * Authorization role, mirrored from the User document on every JWT
       * refresh. Convenient for hiding admin-only UI, but NEVER the security
       * boundary — server routes re-read the role from MongoDB via
       * `requireAdmin()` (src/lib/admin/guard.ts) before acting.
       */
      role: "admin" | "author" | "user";
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    _id: string;
    username: string;
    role: "admin" | "author" | "user";
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    _id: string;
    username: string;
    role: "admin" | "author" | "user";
  }
}
