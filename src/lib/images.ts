/**
 * Cloudinary URL transformer.
 *
 * Adds `f_auto,q_auto` (auto-format + auto-quality) to every Cloudinary
 * URL we render so the CDN serves WebP/AVIF where supported and shrinks
 * payloads by 30-60%. Optional `width` adds responsive sizing.
 *
 * Pass-through for non-Cloudinary URLs (so it's safe to wrap every src).
 */

/** Splits a Cloudinary delivery URL into everything up to `/image/upload/` and the public id that follows. */
const CLOUDINARY_UPLOAD_RE =
  /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/i;

/**
 * A transform segment is a comma-separated list of `key_value` pairs
 * (`f_auto,q_auto,w_800`). Version segments (`v1782810541`) and ordinary
 * public ids (`laptop_hyujfu.png`) don't match, so this only fires when the
 * URL has genuinely been transformed already.
 */
const TRANSFORM_SEGMENT_RE = /^[a-z]{1,3}_[^/,]+(?:,[a-z]{1,3}_[^/,]+)*$/i;

export type ImageTransformOptions = {
  /** Target width in px. Cloudinary scales proportionally. */
  width?: number;
  /** Override the default `auto` quality (e.g. `"auto:eco"` for ~30% smaller). */
  quality?: "auto" | "auto:eco" | "auto:good" | "auto:best" | number;
};

export function optimizeImage(
  url: string | null | undefined,
  opts: ImageTransformOptions = {},
): string {
  if (!url) return "";

  const match = url.match(CLOUDINARY_UPLOAD_RE);
  if (!match) return url;

  const [, deliveryPrefix, publicId] = match;

  // Already carries a transform: leave it alone rather than stacking a second
  // one, which would silently override the caller's intent.
  if (TRANSFORM_SEGMENT_RE.test(publicId.split("/")[0])) return url;

  const transforms = ["f_auto"];
  transforms.push(`q_${opts.quality ?? "auto"}`);
  if (opts.width && opts.width > 0) {
    transforms.push(`w_${Math.round(opts.width)}`, "c_limit");
  }

  // The transform slot sits between `/image/upload/` and the public id, which
  // for our uploads includes a version and folder path
  // (`v1782810541/blog-gpt/posts/<id>.png`).
  return `${deliveryPrefix}${transforms.join(",")}/${publicId}`;
}

/**
 * Build a `sizes` attribute matching our content widths. Useful with
 * `next/image` to serve correctly-sized variants for each viewport.
 */
export const COMMON_IMAGE_SIZES = {
  card: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 390px",
  hero: "(max-width: 1024px) 100vw, 1200px",
  thumb: "(max-width: 640px) 100px, 160px",
} as const;
