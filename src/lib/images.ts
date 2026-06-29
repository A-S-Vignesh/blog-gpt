/**
 * Cloudinary URL transformer.
 *
 * Adds `f_auto,q_auto` (auto-format + auto-quality) to every Cloudinary
 * URL we render so the CDN serves WebP/AVIF where supported and shrinks
 * payloads by 30-60%. Optional `width` adds responsive sizing.
 *
 * Pass-through for non-Cloudinary URLs (so it's safe to wrap every src).
 */

const CLOUDINARY_HOST_RE = /^https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//i;

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
  if (!CLOUDINARY_HOST_RE.test(url)) return url;

  const transforms = ["f_auto"];
  transforms.push(`q_${opts.quality ?? "auto"}`);
  if (opts.width && opts.width > 0) {
    transforms.push(`w_${Math.round(opts.width)}`, "c_limit");
  }

  // Insert the transform string right after `/image/upload/` and before the
  // public-id segment. Cloudinary allows stacking transforms in this slot,
  // and our existing URLs don't pre-transform, so a simple insert is safe.
  return url.replace(
    /(image\/upload\/)(?!.*\/)/i,
    `$1${transforms.join(",")}/`,
  );
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
