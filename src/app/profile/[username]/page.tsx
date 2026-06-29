import { notFound, permanentRedirect } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

// Legacy redirect: /profile/{username}  →  /{username}
//
// User profiles used to live under /profile/. Google may still have those
// URLs indexed. We look up the user (case-insensitively in case of legacy
// mixed-case data), redirect to the canonical lowercase path, or return a
// proper 404 if the user was deleted.
export const dynamic = "force-dynamic";

export default async function LegacyProfileRedirect({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username: rawUsername } = await params;
  const usernameLc = rawUsername.toLowerCase();

  await connectToDatabase();

  // Match case-insensitively to handle any legacy mixed-case URLs that may
  // have been shared externally. New writes are already lowercase-only.
  const user = await User.findOne({ username: usernameLc })
    .collation({ locale: "en", strength: 2 })
    .select("username banned deletionScheduledFor")
    .lean();

  if (!user) {
    notFound();
  }

  // Don't surface banned or mid-deletion accounts through a redirect.
  if ((user as any).banned || (user as any).deletionScheduledFor) {
    notFound();
  }

  // Always redirect to the canonical lowercase username.
  const canonical = ((user as any).username ?? usernameLc).toLowerCase();
  permanentRedirect(`/${canonical}`);
}
