/**
 * Usernames that must NEVER be claimable.
 *
 * Two reasons a word lands on this list:
 *   1. It collides with an existing route — claiming it would either shadow
 *      the route or be shadowed by it (Next.js prioritizes static over
 *      dynamic, so the user would get a broken profile page).
 *   2. It enables impersonation or social engineering — `admin`, `support`,
 *      `noreply`, etc. let a malicious user pose as the platform itself.
 *
 * Keep this list lowercase. The validator lowercases before checking.
 */
const reservedUsernames = [
  // Existing site routes
  "about",
  "account",
  "admin",
  "api",
  "auth",
  "blog",
  "bookmarks",
  "contact",
  "contact-us",
  "cookies-policy",
  "explore",
  "feed",
  "help",
  "login",
  "logout",
  "notifications",
  "post",
  "posts",
  "pricing",
  "privacy",
  "privacy-policy",
  "profile",
  "register",
  "robots",
  "search",
  "settings",
  "signin",
  "signup",
  "sitemap",
  "static",
  "support",
  "tag",
  "tags",
  "terms",
  "terms-of-use",
  "write",
  "edit",
  "403",
  "404",
  "500",

  // Likely future routes — block now to avoid breaking changes later
  "analytics",
  "billing",
  "category",
  "categories",
  "create",
  "dashboard",
  "download",
  "drafts",
  "faq",
  "following",
  "followers",
  "inbox",
  "invite",
  "new",
  "publish",
  "report",
  "reports",
  "rss",
  "share",
  "stories",
  "story",
  "subscribe",
  "team",
  "topic",
  "topics",
  "trending",
  "upgrade",
  "user",
  "users",

  // Impersonation traps
  "bloggpt",
  "thebloggpt",
  "noreply",
  "no-reply",
  "official",
  "root",
  "staff",
  "system",
  "webmaster",
  "moderator",
  "mod",

  // Tech / framework reserved
  "_next",
  "next",
  "vercel",
  "null",
  "undefined",
  "true",
  "false",

  // Common self-reference / ambiguity
  "me",
  "my",
  "you",
  "your",
  "we",
  "us",
];

export default reservedUsernames;

export function isReservedUsername(value: string): boolean {
  return reservedUsernames.includes(value.trim().toLowerCase());
}
