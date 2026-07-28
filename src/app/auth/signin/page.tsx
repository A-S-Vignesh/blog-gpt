import type { Metadata } from "next";
import Login from "@/components/Login";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";

/**
 * Every `?callbackUrl=` variant renders the same page, so Google saw a pile of
 * duplicates with no canonical. Point them all at the bare `/auth/signin` and
 * keep the page itself out of the index — it has nothing to rank for.
 */
export const metadata: Metadata = {
  title: "Sign in | The Blog GPT",
  description: "Sign in to The Blog GPT to write, publish, and manage your posts.",
  alternates: { canonical: "https://thebloggpt.com/auth/signin" },
  robots: { index: false, follow: true },
};

/**
 * Only allow same-origin, absolute-path callbacks (e.g. `/vignesh-devil/post`).
 * Rejecting protocol-relative (`//evil.com`) and absolute URLs prevents an
 * open-redirect via a crafted `?callbackUrl=`.
 */
function safeCallbackUrl(raw: string | string[] | undefined): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

const LoginPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}) => {
  const session = await getServerSession(authOptions);
  const callbackUrl = safeCallbackUrl((await searchParams).callbackUrl);

  // Already logged in: send them where they were headed, else their profile.
  if (session?.user?._id) {
    redirect(callbackUrl ?? `/${session.user.username}`);
  }

  return <Login callbackUrl={callbackUrl ?? undefined} />;
};

export default LoginPage;
