import Login from "@/components/Login";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";

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
