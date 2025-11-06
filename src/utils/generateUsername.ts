// utils/generateUsername.ts
import {User} from "@/models/User";

const USERNAME_REGEX =
  /^(?=.{6,20}$)(?![_-])(?!.*[_-]{2})[a-zA-Z0-9_-]+(?<![_-])$/;

/**
 * Make a safe sanitized base username from a display name
 */
function sanitizeBase(name: string) {
  // keep a-z, 0-9, underscore, hyphen. replace other chars with single dash.
  let base = name
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-") // replace groups of invalid chars with '-'
    .replace(/(^-|-$)/g, ""); // trim leading/trailing dashes

  // collapse repeated dashes/underscores into single
  base = base.replace(/[-_]{2,}/g, (m) => (m[0] === "-" ? "-" : "_"));

  // if everything removed (e.g. name was emoji), fallback to 'user'
  if (!base) base = "user";

  return base;
}

/**
 * Ensure the candidate conforms to the regex length and format constraints.
 * If too long -> trim (and fix trailing char). If too short -> pad with chars.
 */
function normalizeCandidate(candidate: string): string {
  // remove leading/trailing - or _
  candidate = candidate.replace(/(^[_-]+|[_-]+$)/g, "");

  // collapse multiple _ or - (again)
  candidate = candidate.replace(/[-_]{2,}/g, (m) => (m[0] === "-" ? "-" : "_"));

  // if too long, trim to 20 (but avoid cutting leaving trailing - or _)
  if (candidate.length > 20) {
    candidate = candidate.slice(0, 20).replace(/[_-]+$/g, ""); // trim trailing dash/underscore after slicing
    if (!candidate) candidate = "user";
  }

  // if too short (<6), pad with deterministic safe chars (letters + digits)
  if (candidate.length < 6) {
    const needed = 6 - candidate.length;
    // Use a short deterministic string based on base + time to avoid collisions
    const pad = (Math.random().toString(36).slice(2) + "0000").slice(0, needed);
    candidate = (candidate + pad).slice(0, 6);
  }

  return candidate;
}

/**
 * Main exported function
 */
export const generateUsername = async (name: string): Promise<string> => {
  const baseRaw = sanitizeBase(name);
  let base = normalizeCandidate(baseRaw);

  // If the candidate already matches regex, check DB otherwise try to fix/collide
  if (USERNAME_REGEX.test(base)) {
    const exists = await User.findOne({ username: base }).lean().exec();
    if (!exists) return base;
  }

  // If base is taken or doesn't pass regex, try suffix strategies.
  // We'll attempt predictable suffixes to keep them readable:
  // 1) append numeric suffixes like 1,2,... while staying <=20 chars
  // 2) fallback to random 4-digit suffixes
  const MAX_ATTEMPTS = 50;

  for (let i = 1; i <= MAX_ATTEMPTS; i++) {
    // suffix as number (i) or, after some attempts, a 4-digit random
    const suffix =
      i <= 20 ? String(i) : String(Math.floor(1000 + Math.random() * 9000)); // 4-digit

    // trim base to make room for suffix but ensure we keep at least 3 chars of base
    const maxBaseLen = Math.max(3, 20 - suffix.length);
    let candidate = base.slice(0, maxBaseLen) + suffix;

    // normalize again (remove bad start/end chars)
    candidate = normalizeCandidate(candidate);

    // final check: must match regex
    if (!USERNAME_REGEX.test(candidate)) {
      // try to repair small issues: replace double punctuation, trim ends
      candidate = candidate.replace(/[_-]{2,}/g, (m) =>
        m[0] === "-" ? "-" : "_"
      );
      candidate = candidate.replace(/(^[_-]+|[_-]+$)/g, "").slice(0, 20);
      // if still invalid, continue loop
      if (!USERNAME_REGEX.test(candidate)) continue;
    }

    // check DB uniqueness
    // eslint-disable-next-line no-await-in-loop
    const exists = await User.findOne({ username: candidate }).lean().exec();
    if (!exists) return candidate;
  }

  // Last resort: use timestamp-based username (guaranteed unique)
  const fallback = `user${Date.now().toString().slice(-7)}`; // 'user' + last 7 digits of epoch
  // ensure fallback is valid length and format
  const final = normalizeCandidate(fallback).slice(0, 20);
  return final;
};
