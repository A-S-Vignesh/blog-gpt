// lib/sanitizeHtmlForRender.ts
import sanitizeHtml from "sanitize-html";

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
      img: ["src", "alt", "title", "width", "height"],
      a: ["href", "target", "rel"],
      code: ["class"],
    },

    allowedSchemes: ["http", "https", "mailto"],

    // 🔒 Enforce link security AGAIN
    transformTags: {
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
