import commonWords from "@/utils/commonWords";

/**
 * Shared tag rules + detection used by both the client (generate flow, create
 * form) and the server (create/edit routes), so normalization is identical
 * everywhere and the stored tags stay clean, lowercase, deduped, and capped.
 *
 * Tags are load-bearing: they drive related-posts ranking, search, explore
 * filtering, and SEO keywords (OpenGraph article tags + JSON-LD). The explore
 * tag filter is an exact match, so consistent lowercasing is what makes tag
 * navigation actually work across posts.
 */
export const MAX_TAGS = 8;
export const MIN_TAG_LENGTH = 2;
export const MAX_TAG_LENGTH = 30;

const STOP_WORDS = new Set(commonWords.map((w) => w.toLowerCase()));

// Keep technical tokens intact (c++, c#, node.js, .net) while still tokenizing
// natural language. Runs against lowercased text.
const TOKEN_RE = /[a-z0-9][a-z0-9+#.-]*/g;

/**
 * Normalize a single raw tag: strip a leading "#", collapse whitespace,
 * lowercase, and clamp length. Intra-tag punctuation is preserved so tags like
 * "node.js" or "c++" survive.
 */
export function normalizeTag(raw: string): string {
  return raw
    .normalize("NFKC")
    .replace(/^#+/, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .slice(0, MAX_TAG_LENGTH)
    .trim();
}

/**
 * Normalize a list of tags: drop too-short entries, dedupe (case-insensitive),
 * and cap at `max`. Returns clean, storage-ready tags.
 */
export function normalizeTags(tags: unknown, max: number = MAX_TAGS): string[] {
  if (!Array.isArray(tags)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    if (typeof raw !== "string") continue;
    const tag = normalizeTag(raw);
    if (tag.length < MIN_TAG_LENGTH) continue;
    if (seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
    if (out.length >= max) break;
  }
  return out;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Content-aware tag detection. Scores candidate keywords by weighted frequency
 * across the title (strongest signal), the user prompt, and the article body,
 * filters out stop words / pure numbers, and returns the top normalized tags.
 *
 * This reflects what the article is actually about — unlike a naive split of
 * the prompt — so the suggestions are relevant keywords worth indexing.
 */
export function extractTags(input: {
  title?: string;
  content?: string;
  prompt?: string;
  max?: number;
}): string[] {
  const max = input.max ?? MAX_TAGS;
  const scores = new Map<string, number>();

  const ingest = (text: string | undefined, weight: number) => {
    if (!text) return;
    const tokens = text.toLowerCase().match(TOKEN_RE);
    if (!tokens) return;
    for (const token of tokens) {
      const tok = token.replace(/[.-]+$/, ""); // trim trailing dot/hyphen
      if (tok.length < MIN_TAG_LENGTH) continue;
      if (STOP_WORDS.has(tok)) continue;
      if (/^\d+$/.test(tok)) continue; // skip pure numbers
      scores.set(tok, (scores.get(tok) ?? 0) + weight);
    }
  };

  ingest(input.title, 4);
  ingest(input.prompt, 2);
  ingest(stripHtml(input.content ?? ""), 1);

  const ranked = [...scores.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([token]) => token);

  return normalizeTags(ranked, max);
}
