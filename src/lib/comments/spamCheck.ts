/**
 * Lightweight heuristic spam detection for comments.
 * Catches the obvious offenders before we spend tokens on AI moderation.
 */

export type CommentSpamResult =
  | { ok: true }
  | { ok: false; reason: string };

const MAX_LINKS = 2;
const MAX_REPEATED_CHAR_RUN = 12;
const SUSPICIOUS_PATTERNS: RegExp[] = [
  // Crypto / phishing
  /\b(buy|sell|invest|earn)\s+(crypto|bitcoin|btc|eth|nft)\b/i,
  /\bclick (here|this) link\b/i,
  /\bfree (gift|money|trial)\b/i,
  // Adult / pharmacy spam
  /\b(viagra|cialis|escort|porn|xxx)\b/i,
  // "Make $X/day" classics
  /\$\d{2,}\s*\/?\s*(day|hour|week)/i,
];

const LINK_RE = /\b(?:https?:\/\/|www\.)\S+/gi;

export function checkCommentSpam(content: string): CommentSpamResult {
  const text = content.trim();
  if (text.length === 0) return { ok: false, reason: "empty" };
  if (text.length > 1000) return { ok: false, reason: "too long" };

  const linkCount = (text.match(LINK_RE) ?? []).length;
  if (linkCount > MAX_LINKS) {
    return { ok: false, reason: `too many links (${linkCount})` };
  }

  // Long runs of the same character (e.g. "!!!!!!!!!!!!" or "aaaaaaaaaaaa")
  if (new RegExp(`(.)\\1{${MAX_REPEATED_CHAR_RUN},}`).test(text)) {
    return { ok: false, reason: "repeated character spam" };
  }

  // All-caps with > 15 chars triggers
  const letters = text.replace(/[^a-zA-Z]/g, "");
  if (letters.length > 20 && letters === letters.toUpperCase()) {
    return { ok: false, reason: "all caps" };
  }

  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(text)) return { ok: false, reason: "suspicious phrase" };
  }

  return { ok: true };
}
