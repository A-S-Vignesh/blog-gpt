// lib/sanitizeHtmlForRender.ts
import sanitizeHtml from "sanitize-html";
import { optimizeImage } from "@/lib/images";

/**
 * Google truncates image alt text well before this, and long alt is read out
 * verbatim by screen readers. Editors occasionally paste a whole sentence (or
 * the post title) in, so trim at a word boundary rather than mid-word.
 */
const MAX_ALT_LENGTH = 100;

function trimAlt(alt: string): string {
  if (alt.length <= MAX_ALT_LENGTH) return alt;
  const cut = alt.slice(0, MAX_ALT_LENGTH);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trimEnd();
}

export function sanitizeForRender(html: string) {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "img",
      "pre",
      "code",
      "table",
      "thead",
      "tbody",
      "tr",
      "td",
      "th",
    ]),

    allowedAttributes: {
      "*": ["class"],
      img: [
        "src",
        "alt",
        "title",
        "width",
        "height",
        "loading",
        "decoding",
        "sizes",
      ],
      a: ["href", "target", "rel"],
      code: ["class"],
    },

    allowedSchemes: ["http", "https", "mailto"],

    transformTags: {
      /**
       * Body images are written straight into the post HTML by the editor, so
       * unlike our card/hero images they never pass through `next/image` and
       * were being served as the raw Cloudinary original. In practice that
       * meant multi-megabyte PNGs (2.3 MB was typical) downloaded in full on
       * every article view. Routing them through `optimizeImage` hands the
       * CDN `f_auto,q_auto,w_1600,c_limit`, which serves WebP/AVIF at display
       * width and cuts those to roughly 100-200 KB.
       *
       * Width/height are deliberately not synthesized here: we don't know the
       * intrinsic aspect ratio at render time, and guessing would trade a
       * layout shift for a wrong one. They pass through when the editor
       * recorded them.
       */
      img: (tagName, attribs) => {
        const alt = attribs.alt ? trimAlt(attribs.alt) : "";

        return {
          tagName: "img",
          attribs: {
            ...attribs,
            src: optimizeImage(attribs.src, { width: 1600 }),
            alt,
            loading: attribs.loading ?? "lazy",
            decoding: attribs.decoding ?? "async",
          },
        };
      },

      // 🔒 Enforce link security AGAIN
      a: (tagName, attribs) => {
        let href = attribs.href || "";

        const isMailto = /^mailto:/i.test(href);
        const isAbsolute = /^https?:\/\//i.test(href);
        const isBareDomain = /^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(href); // e.g., codolve.com or codolve.com/page

        if (!isMailto && !isAbsolute) {
          if (isBareDomain) {
            // Prepend https:// to bare domains
            href = `https://${href}`;
          } else {
            // Strip internal/relative links
            return {
              tagName: "span",
              attribs: {},
              text: attribs.href || "",
            };
          }
        }

        return {
          tagName: "a",
          attribs: {
            ...attribs,
            href,
            target: "_blank",
            rel: "nofollow noopener noreferrer",
          },
        };
      },
    },
  });
}
