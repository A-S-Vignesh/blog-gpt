/**
 * Helpers for keeping generated <title> and meta description text inside the
 * lengths Google will actually render.
 *
 * Post titles are author-supplied and routinely run long, so appending the
 * brand suffix unconditionally pushed many pages past the truncation point.
 */

/**
 * The one canonical spelling of the brand, matching the domain and the logo.
 *
 * This used to be written four different ways across the app ("TheBlogGPT",
 * "Blog-GPT", "BlogGPT", "The Blog GPT"), including three different
 * `og:site_name` values. Google reads og:site_name and the WebSite schema to
 * decide which name to print under the URL in search results, so conflicting
 * values meant it was picking for us. Import this instead of hardcoding.
 */
export const SITE_NAME = "The Blog GPT";

export const SITE_URL = "https://thebloggpt.com";

/**
 * Spellings people actually type when searching for the site. Declared as
 * schema.org `alternateName` so Google can connect them to the brand without
 * us displaying them anywhere.
 */
export const SITE_ALTERNATE_NAMES = ["TheBlogGPT", "BlogGPT", "Blog GPT"];

/** Google truncates around 60 characters (~561px) in the SERP. */
const MAX_TITLE_LENGTH = 60;

/** Google truncates snippets around 155 characters (~985px). */
const MAX_DESCRIPTION_LENGTH = 155;

/** Trim to `max` characters on a word boundary, falling back to a hard cut. */
function trimToWord(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  // Only honour the word boundary if it isn't so early that we'd lose most of
  // the text (happens with very long single tokens, e.g. a pasted URL).
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd();
}

/**
 * Build a page title that fits the SERP.
 *
 * Preference order: title plus brand suffix, then the bare title (a complete
 * headline is worth more to a searcher than the brand), then a trimmed title.
 */
export function pageTitle(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) return SITE_NAME;

  const withBrand = `${trimmed} | ${SITE_NAME}`;
  if (withBrand.length <= MAX_TITLE_LENGTH) return withBrand;
  if (trimmed.length <= MAX_TITLE_LENGTH) return trimmed;

  return `${trimToWord(trimmed, MAX_TITLE_LENGTH - 1)}…`;
}

/**
 * Build a meta description that fits the SERP. Collapses whitespace left over
 * from stripping HTML, then trims on a word boundary rather than mid-word.
 */
export function metaDescription(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= MAX_DESCRIPTION_LENGTH) return normalized;

  return `${trimToWord(normalized, MAX_DESCRIPTION_LENGTH - 1)}…`;
}
