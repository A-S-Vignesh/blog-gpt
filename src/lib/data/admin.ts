import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import Post from "@/models/Post";
import Comment from "@/models/Comment";
import ContactMessage from "@/models/ContactMessage";
import { Subscription } from "@/models/Subscription";
import AdminAuditLog from "@/models/AdminAuditLog";
import AdCampaign from "@/models/AdCampaign";
import { requireAdmin } from "@/lib/admin/guard";

/**
 * Every exported function in this file begins with `await requireAdmin()`.
 *
 * This is the authorization boundary — NOT /admin/layout.tsx. A layout is the
 * wrong place to enforce access: the App Router skips re-rendering a layout
 * when the client's `Next-Router-State-Tree` header says that segment is
 * already present, and that header is supplied by the caller. A signed-in
 * non-admin could therefore request an admin page in a way that renders the
 * page without ever running the layout's check. Next.js' own guidance is to
 * authorize in the data access layer for exactly this reason.
 *
 * Putting the check here means the data cannot be read without it, no matter
 * how the render was reached or what a future page forgets to do. The layout
 * and page checks stay, because they produce a clean /403 redirect instead of
 * an error boundary — they are UX, this is the lock.
 *
 * requireAdmin() is memoized per request (React `cache`), so the repetition
 * costs one session read and one indexed lookup per request in total.
 */

/** Escape user input before it is interpolated into a MongoDB $regex. */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Query fragment for "never classified".
 *
 * The schema defaults `moderationStatus` to "pending", but posts written
 * before that field existed carry no value at all — 31 of them here. Querying
 * the literal string finds none of those, which made the dashboard report 0
 * awaiting moderation while the table showed a screenful of "pending" badges.
 * In MongoDB a `null` in `$in` also matches a missing field, so this single
 * fragment covers both and keeps the count, the filter, and the badge honest.
 */
const PENDING_MODERATION = { $in: ["pending", null] };

/**
 * Serialize a document date, tolerating documents that simply don't have one.
 *
 * `timestamps: true` was added to these schemas after the site had real
 * content, so older rows carry no `createdAt` at all — and `new
 * Date(undefined).toISOString()` throws RangeError, which is enough to take a
 * whole admin page down over one legacy row. Candidates are tried in order,
 * then we fall back to the timestamp every ObjectId embeds in its first four
 * bytes. That fallback always exists and is truthful (it is the insertion
 * time), so this function cannot fail and callers always get a real date.
 */
function toIsoDate(fallbackId: Types.ObjectId, ...candidates: unknown[]): string {
  for (const candidate of candidates) {
    if (!candidate) continue;
    const parsed = new Date(candidate as string | number | Date);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return fallbackId.getTimestamp().toISOString();
}

export type AdminStats = {
  users: {
    total: number;
    newThisWeek: number;
    banned: number;
    pendingDeletion: number;
    admins: number;
  };
  posts: {
    total: number;
    published: number;
    drafts: number;
    flagged: number;
    pendingModeration: number;
    newThisWeek: number;
  };
  comments: { total: number; newThisWeek: number };
  messages: { total: number; unread: number };
  subscriptions: { active: number; pro: number; business: number };
};

function weekAgo(): Date {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
}

/**
 * Dashboard counters.
 *
 * All counts are issued as a single Promise.all rather than sequentially — the
 * dashboard is the first thing an admin sees, and a serial chain of round-trips
 * to Atlas would make it feel broken. Each count either hits an existing index
 * (moderationStatus, status, banned, deletionScheduledFor, role) or is a cheap
 * collection-level count.
 */
export async function getAdminStats(): Promise<AdminStats> {
  await requireAdmin();
  await connectToDatabase();
  const since = weekAgo();

  const [
    usersTotal,
    usersNew,
    usersBanned,
    usersDeleting,
    usersAdmins,
    postsTotal,
    postsPublished,
    postsDrafts,
    postsFlagged,
    postsPending,
    postsNew,
    commentsTotal,
    commentsNew,
    messagesTotal,
    messagesUnread,
    subsActive,
    subsPro,
    subsBusiness,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ createdAt: { $gte: since } }),
    User.countDocuments({ banned: true }),
    User.countDocuments({ deletionScheduledFor: { $ne: null } }),
    User.countDocuments({ role: "admin" }),
    Post.countDocuments({}),
    Post.countDocuments({ status: "published" }),
    Post.countDocuments({ status: "draft" }),
    Post.countDocuments({ moderationStatus: "flagged" }),
    Post.countDocuments({ moderationStatus: PENDING_MODERATION }),
    Post.countDocuments({ createdAt: { $gte: since } }),
    Comment.countDocuments({}),
    Comment.countDocuments({ createdAt: { $gte: since } }),
    ContactMessage.countDocuments({}),
    ContactMessage.countDocuments({ status: "new" }),
    Subscription.countDocuments({ status: "active" }),
    Subscription.countDocuments({ status: "active", plan: "pro" }),
    Subscription.countDocuments({ status: "active", plan: "business" }),
  ]);

  return {
    users: {
      total: usersTotal,
      newThisWeek: usersNew,
      banned: usersBanned,
      pendingDeletion: usersDeleting,
      admins: usersAdmins,
    },
    posts: {
      total: postsTotal,
      published: postsPublished,
      drafts: postsDrafts,
      flagged: postsFlagged,
      pendingModeration: postsPending,
      newThisWeek: postsNew,
    },
    comments: { total: commentsTotal, newThisWeek: commentsNew },
    messages: { total: messagesTotal, unread: messagesUnread },
    subscriptions: { active: subsActive, pro: subsPro, business: subsBusiness },
  };
}

export type AdminBadges = {
  flaggedPosts: number;
  unreadMessages: number;
  pendingAds: number;
};

/**
 * The two counts the sidebar renders as attention badges.
 *
 * Deliberately separate from getAdminStats(): the layout runs on every admin
 * page navigation, and it has no business issuing eighteen counts just to
 * decide whether to draw two dots.
 */
export async function getAdminBadges(): Promise<AdminBadges> {
  await requireAdmin();
  await connectToDatabase();
  const [flaggedPosts, unreadMessages, pendingAds] = await Promise.all([
    Post.countDocuments({ moderationStatus: "flagged" }),
    ContactMessage.countDocuments({ status: "new" }),
    AdCampaign.countDocuments({ status: "pending_review" }),
  ]);
  return { flaggedPosts, unreadMessages, pendingAds };
}

// ─── Post moderation listing ────────────────────────────────────────────────

export type AdminPostRow = {
  _id: string;
  title: string;
  slug: string;
  status: string;
  moderationStatus: string;
  moderationReason: string;
  moderationCategories: string[];
  views: number;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  author: { username: string; name: string; email: string } | null;
};

export type AdminPostFilter = {
  moderationStatus?: "pending" | "approved" | "flagged";
  status?: "draft" | "published" | "archived";
  q?: string;
  skip?: number;
  limit?: number;
};

export type AdminPostPage = {
  posts: AdminPostRow[];
  total: number;
  skip: number;
  limit: number;
  hasMore: boolean;
};

/**
 * Paginated post list for the moderation screens.
 *
 * Selects an explicit field list rather than the whole document: `content` is
 * the largest field in the database and this table never renders it, so
 * fetching it would multiply the payload for no benefit.
 */
export async function listAdminPosts(
  filter: AdminPostFilter = {},
): Promise<AdminPostPage> {
  await requireAdmin();
  await connectToDatabase();

  const limit = Math.min(Math.max(filter.limit ?? 25, 1), 100);
  const skip = Math.max(filter.skip ?? 0, 0);

  const query: Record<string, unknown> = {};
  if (filter.moderationStatus) {
    query.moderationStatus =
      filter.moderationStatus === "pending"
        ? PENDING_MODERATION
        : filter.moderationStatus;
  }
  if (filter.status) query.status = filter.status;
  if (filter.q) {
    // Escaped before it becomes a regex: an unescaped search box is both a
    // ReDoS vector and the reason a typed dot would match every post.
    query.title = { $regex: escapeRegex(filter.q), $options: "i" };
  }

  const [docs, total] = await Promise.all([
    Post.find(query)
      .select(
        "title slug status moderationStatus moderationReason moderationCategories views likesCount commentsCount createdAt date creator",
      )
      .populate("creator", "username name email")
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Post.countDocuments(query),
  ]);

  const posts: AdminPostRow[] = (docs as any[]).map((p) => ({
    _id: String(p._id),
    title: p.title ?? "",
    slug: p.slug ?? "",
    status: p.status ?? "draft",
    moderationStatus: p.moderationStatus ?? "pending",
    moderationReason: p.moderationReason ?? "",
    moderationCategories: p.moderationCategories ?? [],
    views: p.views ?? 0,
    likesCount: p.likesCount ?? 0,
    commentsCount: p.commentsCount ?? 0,
    // `date` is the publish time and is the better answer when it exists on a
    // legacy post that has no `createdAt`.
    createdAt: toIsoDate(p._id, p.createdAt, p.date),
    author: p.creator
      ? {
          username: p.creator.username ?? "",
          name: p.creator.name ?? "",
          email: p.creator.email ?? "",
        }
      : null,
  }));

  return { posts, total, skip, limit, hasMore: skip + posts.length < total };
}

// ─── Comment listing ────────────────────────────────────────────────────────

export type AdminCommentRow = {
  _id: string;
  content: string;
  postSlug: string;
  postId: string;
  createdAt: string;
  author: { username: string; name: string } | null;
};

export type AdminCommentPage = {
  comments: AdminCommentRow[];
  total: number;
  skip: number;
  limit: number;
  hasMore: boolean;
};

export async function listAdminComments(
  opts: { q?: string; skip?: number; limit?: number } = {},
): Promise<AdminCommentPage> {
  await requireAdmin();
  await connectToDatabase();

  const limit = Math.min(Math.max(opts.limit ?? 25, 1), 100);
  const skip = Math.max(opts.skip ?? 0, 0);

  const query: Record<string, unknown> = {};
  if (opts.q) {
    query.content = { $regex: escapeRegex(opts.q), $options: "i" };
  }

  const [docs, total] = await Promise.all([
    Comment.find(query)
      .select("content postSlug postId createdAt userId")
      .populate("userId", "username name")
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Comment.countDocuments(query),
  ]);

  const comments: AdminCommentRow[] = (docs as any[]).map((c) => ({
    _id: String(c._id),
    content: c.content ?? "",
    postSlug: c.postSlug ?? "",
    postId: String(c.postId ?? ""),
    createdAt: toIsoDate(c._id, c.createdAt),
    author: c.userId
      ? { username: c.userId.username ?? "", name: c.userId.name ?? "" }
      : null,
  }));

  return {
    comments,
    total,
    skip,
    limit,
    hasMore: skip + comments.length < total,
  };
}

// ─── Contact message inbox ──────────────────────────────────────────────────

export type AdminMessageRow = {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "new" | "read" | "replied";
  createdAt: string;
};

export type AdminMessagePage = {
  messages: AdminMessageRow[];
  total: number;
  skip: number;
  limit: number;
  hasMore: boolean;
};

export async function listAdminMessages(
  opts: {
    status?: "new" | "read" | "replied";
    skip?: number;
    limit?: number;
  } = {},
): Promise<AdminMessagePage> {
  await requireAdmin();
  await connectToDatabase();

  const limit = Math.min(Math.max(opts.limit ?? 25, 1), 100);
  const skip = Math.max(opts.skip ?? 0, 0);

  const query: Record<string, unknown> = {};
  if (opts.status) query.status = opts.status;

  const [docs, total] = await Promise.all([
    ContactMessage.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ContactMessage.countDocuments(query),
  ]);

  const messages: AdminMessageRow[] = (docs as any[]).map((m) => ({
    _id: String(m._id),
    name: m.name ?? "",
    email: m.email ?? "",
    subject: m.subject ?? "",
    message: m.message ?? "",
    status: m.status ?? "new",
    createdAt: toIsoDate(m._id, m.createdAt),
  }));

  return {
    messages,
    total,
    skip,
    limit,
    hasMore: skip + messages.length < total,
  };
}

// ─── User management ────────────────────────────────────────────────────────

export type AdminUserRow = {
  _id: string;
  name: string;
  username: string;
  email: string;
  image: string;
  role: "admin" | "author" | "user";
  plan: string;
  planStatus: string;
  banned: boolean;
  bannedReason: string;
  emailVerified: boolean;
  aiGenerationCount: number;
  aiExtraCredits: number;
  followersCount: number;
  postsCount: number;
  /** Presence only. The key itself is a user secret and never leaves the DB. */
  hasGeminiKey: boolean;
  deletionScheduledFor: string | null;
  createdAt: string;
};

export type AdminUserPage = {
  users: AdminUserRow[];
  total: number;
  skip: number;
  limit: number;
  hasMore: boolean;
};

export type AdminUserFilter = {
  q?: string;
  role?: "admin" | "author" | "user";
  plan?: "free" | "pro" | "business";
  state?: "banned" | "deleting";
  skip?: number;
  limit?: number;
};

/**
 * Paginated user directory.
 *
 * The `.select()` here is a DENY list by omission and is the security-relevant
 * line in this file: `geminiApiKey` (a user's own API credential) and
 * `deletionCancelToken` (a capability token — anyone holding it can cancel that
 * user's account deletion) must never reach a browser, not even an admin's.
 * Only `hasGeminiKey`, a boolean, is derived from the former.
 */
export async function listAdminUsers(
  filter: AdminUserFilter = {},
): Promise<AdminUserPage> {
  await requireAdmin();
  await connectToDatabase();

  const limit = Math.min(Math.max(filter.limit ?? 25, 1), 100);
  const skip = Math.max(filter.skip ?? 0, 0);

  const query: Record<string, unknown> = {};
  if (filter.role) query.role = filter.role;
  if (filter.plan) query.plan = filter.plan;
  if (filter.state === "banned") query.banned = true;
  if (filter.state === "deleting") query.deletionScheduledFor = { $ne: null };
  if (filter.q) {
    const re = { $regex: escapeRegex(filter.q), $options: "i" };
    query.$or = [{ name: re }, { username: re }, { email: re }];
  }

  const [docs, total] = await Promise.all([
    User.find(query)
      .select(
        "name username email image role plan planStatus banned bannedReason emailVerified aiGenerationCount aiExtraCredits followersCount deletionScheduledFor createdAt geminiApiKey",
      )
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query),
  ]);

  // One grouped count for the whole page instead of a countDocuments per row.
  const ids = (docs as any[]).map((u) => u._id);
  const postCounts = new Map<string, number>();
  if (ids.length > 0) {
    const grouped = await Post.aggregate<{ _id: Types.ObjectId; count: number }>(
      [
        { $match: { creator: { $in: ids } } },
        { $group: { _id: "$creator", count: { $sum: 1 } } },
      ],
    );
    for (const g of grouped) postCounts.set(String(g._id), g.count);
  }

  const users: AdminUserRow[] = (docs as any[]).map((u) => ({
    _id: String(u._id),
    name: u.name ?? "",
    username: u.username ?? "",
    email: u.email ?? "",
    image: u.image ?? "",
    role: u.role ?? "user",
    plan: u.plan ?? "free",
    planStatus: u.planStatus ?? "active",
    banned: Boolean(u.banned),
    bannedReason: u.bannedReason ?? "",
    emailVerified: Boolean(u.emailVerified),
    aiGenerationCount: u.aiGenerationCount ?? 0,
    aiExtraCredits: u.aiExtraCredits ?? 0,
    followersCount: u.followersCount ?? 0,
    postsCount: postCounts.get(String(u._id)) ?? 0,
    hasGeminiKey: Boolean(u.geminiApiKey),
    deletionScheduledFor: u.deletionScheduledFor
      ? new Date(u.deletionScheduledFor).toISOString()
      : null,
    createdAt: toIsoDate(u._id, u.createdAt),
  }));

  return { users, total, skip, limit, hasMore: skip + users.length < total };
}

// ─── Audit log ──────────────────────────────────────────────────────────────

export type AdminAuditRow = {
  _id: string;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  targetLabel: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  reason: string;
  ip: string;
  createdAt: string;
};

export type AdminAuditPage = {
  entries: AdminAuditRow[];
  total: number;
  skip: number;
  limit: number;
  hasMore: boolean;
};

export async function listAdminAuditLog(
  opts: { action?: string; targetType?: string; skip?: number; limit?: number } = {},
): Promise<AdminAuditPage> {
  await requireAdmin();
  await connectToDatabase();

  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 100);
  const skip = Math.max(opts.skip ?? 0, 0);

  const query: Record<string, unknown> = {};
  // Both are compared against a fixed allowlist by the caller, so they are
  // plain strings here and cannot smuggle a query operator.
  if (opts.action) query.action = opts.action;
  if (opts.targetType) query.targetType = opts.targetType;

  const [docs, total] = await Promise.all([
    AdminAuditLog.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AdminAuditLog.countDocuments(query),
  ]);

  const entries: AdminAuditRow[] = (docs as any[]).map((e) => ({
    _id: String(e._id),
    actorEmail: e.actorEmail ?? "",
    action: e.action ?? "",
    targetType: e.targetType ?? "",
    targetId: String(e.targetId ?? ""),
    targetLabel: e.targetLabel ?? "",
    before: e.before ?? null,
    after: e.after ?? null,
    reason: e.reason ?? "",
    ip: e.ip ?? "",
    createdAt: toIsoDate(e._id, e.createdAt),
  }));

  return { entries, total, skip, limit, hasMore: skip + entries.length < total };
}
