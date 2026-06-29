/**
 * Shared post-content helpers used by the create and edit routes so the excerpt
 * and upload-size rules stay identical in both places.
 */

/** Max decoded size of an uploaded base64 image — matches the "5MB" UI copy. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Approximate decoded byte size of a base64 data URI. */
export function dataUriByteSize(dataUri: string): number {
  const comma = dataUri.indexOf(",");
  const b64 = comma >= 0 ? dataUri.slice(comma + 1) : dataUri;
  return Math.ceil((b64.length * 3) / 4);
}

/**
 * Build a clean excerpt from plain text: trims to a word boundary and only
 * appends an ellipsis when the text was actually truncated. Avoids the old bug
 * where short/space-less content produced a bare "...".
 */
export function buildExcerpt(plainText: string, max = 150): string {
  const text = plainText.trim();
  if (text.length <= max) return text;
  let slice = text.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  if (lastSpace > max / 2) slice = slice.slice(0, lastSpace);
  return slice.trim() + "...";
}
