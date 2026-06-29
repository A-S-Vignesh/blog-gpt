/**
 * Production share infrastructure.
 *
 * Why this exists:
 *   - One source of truth for share-target URLs (Twitter intent, WhatsApp `wa.me`,
 *     etc.) so we don't drift across components.
 *   - UTM tagging on outbound URLs so the host site can attribute incoming
 *     traffic back to the channel a reader shared from.
 *   - A clipboard helper that survives non-HTTPS / older-browser contexts
 *     (the modern Clipboard API requires a secure context).
 */

export const SHARE_CHANNELS = [
  "twitter",
  "facebook",
  "linkedin",
  "whatsapp",
  "telegram",
  "reddit",
  "email",
  "copy",
  "native",
] as const;

export type ShareChannel = (typeof SHARE_CHANNELS)[number];

export function isShareChannel(value: unknown): value is ShareChannel {
  return (
    typeof value === "string" &&
    (SHARE_CHANNELS as readonly string[]).includes(value)
  );
}

/**
 * Append UTM params so we can attribute traffic back to the channel.
 * Preserves any existing query params on the source URL.
 */
export function withUtm(rawUrl: string, channel: ShareChannel): string {
  try {
    const u = new URL(rawUrl);
    u.searchParams.set("utm_source", channel);
    u.searchParams.set("utm_medium", "share");
    u.searchParams.set("utm_campaign", "post_share");
    return u.toString();
  } catch {
    // Bad URL — fall back to the raw string rather than crashing the share.
    return rawUrl;
  }
}

export type ShareMeta = {
  /** Canonical URL of the thing being shared (no UTM — we add it here). */
  url: string;
  /** Title shown in the share target's compose UI. */
  title: string;
  /** Short description/excerpt (some channels concatenate this with title). */
  text?: string;
};

/**
 * Build the outbound URL for a given channel. Returns `null` for channels
 * that don't have an HTTP share target (native, copy) — the caller handles
 * those locally.
 */
export function buildShareTarget(
  channel: ShareChannel,
  meta: ShareMeta,
): string | null {
  const url = withUtm(meta.url, channel);
  const title = meta.title;
  const text = meta.text || meta.title;

  switch (channel) {
    case "twitter":
      // X/Twitter web intent. `text` becomes the tweet body; the URL is
      // auto-attached after it.
      return `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        title,
      )}&url=${encodeURIComponent(url)}`;
    case "facebook":
      // FB's sharer reads og:* tags off the linked page — the `quote` param
      // is suggestion text the user can edit before posting.
      return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        url,
      )}&quote=${encodeURIComponent(title)}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        url,
      )}`;
    case "whatsapp":
      // wa.me works on both mobile (opens the app) and desktop (WhatsApp Web).
      return `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`;
    case "telegram":
      return `https://t.me/share/url?url=${encodeURIComponent(
        url,
      )}&text=${encodeURIComponent(title)}`;
    case "reddit":
      return `https://www.reddit.com/submit?url=${encodeURIComponent(
        url,
      )}&title=${encodeURIComponent(title)}`;
    case "email":
      return `mailto:?subject=${encodeURIComponent(
        title,
      )}&body=${encodeURIComponent(`${text}\n\n${url}`)}`;
    case "copy":
    case "native":
      return null;
  }
}

/**
 * Copy text to the clipboard with a fallback for non-secure contexts
 * (http://, file://) where the modern Clipboard API throws. Returns true on
 * success so callers can show feedback without inventing their own retry path.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the legacy path.
    }
  }
  if (typeof document === "undefined") return false;
  try {
    // Legacy execCommand path — deprecated but still the only thing that
    // works outside a secure context. The textarea has to be visible-but-offscreen
    // so iOS doesn't refuse to select it.
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "0";
    ta.style.left = "0";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Format a share count for the badge: 1234 -> "1.2k", 12345 -> "12k".
 * Below 1000 we show the raw number so a post with 4 shares doesn't show "0".
 */
export function formatShareCount(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n < 1000) return String(n);
  if (n < 10000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  if (n < 1000000) return Math.floor(n / 1000) + "k";
  return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
}
