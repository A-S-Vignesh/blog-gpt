/**
 * Single source of truth for post field limits + validation.
 *
 * Imported by BOTH the client (form gating, maxlength, pre-submit checks) and
 * the API routes (the authoritative check). Keeping one module means the client
 * and server can never drift, and common validation is caught before a request
 * is ever sent.
 */
export const POST_LIMITS = {
  TITLE_MIN: 10,
  TITLE_MAX: 120,
  // Slugs are URL identifiers — short ones like "react-19" are valid and good
  // for SEO, so the floor stays low. The cap prevents abusive/giant slugs.
  SLUG_MIN: 3,
  SLUG_MAX: 96,
  // Min is measured on VISIBLE text (tags stripped); max is on raw length to
  // cap the payload size.
  CONTENT_MIN: 300,
  CONTENT_MAX: 20_000,
  TAGS_MIN: 1,
  TAGS_MAX: 8,
} as const;

/** Visible-text length of HTML content (tags + entities stripped). */
export function contentTextLength(html: string): number {
  return (html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim().length;
}

/**
 * Canonical slugify: lowercase, strip non-url chars, collapse hyphens, and
 * CAP at SLUG_MAX (trimming a trailing hyphen). Used everywhere a slug is
 * produced (typed slug on create, auto-slug on generate) so a long title can
 * never yield an over-length slug that the API would reject.
 */
export function slugify(value: string): string {
  let s = (value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (s.length > POST_LIMITS.SLUG_MAX) {
    s = s.slice(0, POST_LIMITS.SLUG_MAX).replace(/-+$/g, "");
  }
  return s;
}

/**
 * Slugify a value taken from a URL path segment.
 *
 * Next.js leaves RESERVED characters percent-encoded in dynamic route params —
 * a request for `/post/a%20b` yields the literal param `"a%20b"`, not `"a b"`.
 * Slugifying that directly strips the `%` and leaves the digits, so `%20`
 * becomes `20` and the result is garbage. Legacy indexed URLs are full of
 * encoded spaces and commas, so they must be decoded before normalizing.
 */
export function slugifyPathSegment(segment: string): string {
  let decoded = segment;
  try {
    decoded = decodeURIComponent(segment);
  } catch {
    // Malformed percent-sequence (e.g. a stray "%"). decodeURIComponent throws
    // on those, so fall back to the raw segment rather than 500 the request.
  }
  return slugify(decoded);
}

export type PostValidationInput = {
  title?: string;
  content?: string;
  slug?: string;
  tags?: string[];
  /** Validate the slug too — true on create; false on edit (slug is fixed). */
  requireSlug?: boolean;
};

/**
 * Returns the first human-readable validation error, or null if valid.
 * Intentionally returns a plain string (never an object) so it is always safe
 * to show directly in a toast / inline message.
 */
export function validatePost(input: PostValidationInput): string | null {
  const {
    TITLE_MIN,
    TITLE_MAX,
    SLUG_MIN,
    SLUG_MAX,
    CONTENT_MIN,
    CONTENT_MAX,
    TAGS_MIN,
    TAGS_MAX,
  } = POST_LIMITS;

  const title = (input.title || "").trim();
  if (title.length < TITLE_MIN)
    return `Title must be at least ${TITLE_MIN} characters.`;
  if (title.length > TITLE_MAX)
    return `Title must be ${TITLE_MAX} characters or fewer.`;

  const textLen = contentTextLength(input.content || "");
  if (textLen < CONTENT_MIN)
    return `Content must be at least ${CONTENT_MIN} characters.`;
  if ((input.content || "").length > CONTENT_MAX)
    return `Content is too long (max ${CONTENT_MAX} characters).`;

  if (input.requireSlug) {
    const slug = (input.slug || "").trim();
    if (slug.length < SLUG_MIN)
      return `Slug must be at least ${SLUG_MIN} characters.`;
    if (slug.length > SLUG_MAX)
      return `Slug must be ${SLUG_MAX} characters or fewer.`;
  }

  const tags = input.tags || [];
  if (tags.length < TAGS_MIN) return `Add at least ${TAGS_MIN} tag.`;
  if (tags.length > TAGS_MAX) return `You can add up to ${TAGS_MAX} tags.`;

  return null;
}
