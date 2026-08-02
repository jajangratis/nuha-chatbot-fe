import DOMPurify from "isomorphic-dompurify";

const NUHA_ORIGIN = "https://nuha.care";
const FETCH_TIMEOUT_MS = 15_000;

function absolutize(url: string): string {
  const trimmed = url.trim();
  if (
    !trimmed ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:") ||
    trimmed.startsWith("#")
  ) {
    return trimmed;
  }
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }
  return `${NUHA_ORIGIN}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
}

function absolutizeAttributes(html: string): string {
  let result = html.replace(
    /(href|src|action)=["']\/([^"']*?)["']/gi,
    (_, attr: string, path: string) => `${attr}="${NUHA_ORIGIN}/${path}"`,
  );

  result = result.replace(
    /(href|src)=["'](?!https?:|\/\/|data:|#|mailto:|tel:)([^"']+)["']/gi,
    (match, attr: string, path: string) => {
      if (path.startsWith("http")) return match;
      return `${attr}="${absolutize(path)}"`;
    },
  );

  result = result.replace(/url\((['"]?)\//g, `url($1${NUHA_ORIGIN}/`);
  result = result.replace(/url\(&#x27;\//g, `url(&#x27;${NUHA_ORIGIN}/`);

  result = result.replace(/srcset="([^"]+)"/gi, (_, srcset: string) => {
    const fixed = srcset
      .split(",")
      .map((part) => {
        const pieces = part.trim().split(/\s+/);
        const url = absolutize(pieces[0] ?? "");
        const descriptor = pieces.slice(1).join(" ");
        return descriptor ? `${url} ${descriptor}` : url;
      })
      .join(", ");
    return `srcset="${fixed}"`;
  });

  return result;
}

/**
 * Sanitize HTML using DOMPurify to prevent XSS from external source.
 *
 * Removes inline event handlers (onerror, onload, etc.), dangerous tags,
 * and script execution vectors while preserving layout and styling.
 */
function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "div", "span", "p", "a", "img", "ul", "ol", "li",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "table", "thead", "tbody", "tr", "td", "th",
      "section", "article", "header", "footer", "nav", "main", "aside",
      "figure", "figcaption", "picture", "source",
      "strong", "em", "b", "i", "u", "s", "br", "hr",
      "blockquote", "pre", "code", "sup", "sub",
      "button", "form", "input", "label", "select", "option", "textarea",
      "svg", "path", "circle", "rect", "line", "g", "defs", "use",
      "style", "link",
    ],
    ALLOWED_ATTR: [
      "class", "id", "style", "href", "src", "alt", "title",
      "target", "rel", "type", "name", "value", "placeholder",
      "width", "height", "loading", "decoding", "fetchpriority",
      "srcset", "sizes", "media", "as",
      "aria-*", "data-*", "role",
      "viewBox", "fill", "stroke", "d", "cx", "cy", "r",
      "xmlns", "fill-rule", "clip-rule", "stroke-width",
    ],
    ALLOW_DATA_ATTR: true,
    ALLOW_ARIA_ATTR: true,
  });
}

export type NuhaMirrorContent = {
  bodyHtml: string;
  styleLinks: string[];
};

export async function fetchNuhaMirror(path = "/"): Promise<NuhaMirrorContent> {
  const url = `${NUHA_ORIGIN}${path === "/" ? "" : path}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NuhaCareClone/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[nuha-mirror] Fetch gagal untuk ${url}: ${message}`);
    throw new Error(
      `Tidak dapat menghubungi nuha.care. Periksa koneksi internet Anda.`,
    );
  }

  if (!res.ok) {
    console.error(`[nuha-mirror] HTTP ${res.status} dari ${url}`);
    throw new Error(
      `Gagal memuat halaman Nuha (HTTP ${res.status}). Coba lagi nanti.`,
    );
  }

  const rawHtml = await res.text();
  return transformNuhaHtml(rawHtml);

}

export function transformNuhaHtml(html: string): NuhaMirrorContent {
  const styleLinks: string[] = [];
  const linkRegex = /<link[^>]+rel=["']stylesheet["'][^>]*>/gi;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(html)) !== null) {
    const hrefMatch = match[0].match(/href=["']([^"']+)["']/i)
    if (hrefMatch?.[1]) {
      styleLinks.push(absolutize(hrefMatch[1]));
    }
  }

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  let bodyHtml = bodyMatch?.[1] ?? html;

  // Remove all scripts before sanitization
  bodyHtml = bodyHtml.replace(/<script\b[\s\S]*?<\/script>/gi, "");
  bodyHtml = absolutizeAttributes(bodyHtml);

  // Sanitize to remove inline event handlers and other XSS vectors
  bodyHtml = sanitizeHtml(bodyHtml);

  return {
    bodyHtml,
    styleLinks: [...new Set(styleLinks)],
  };
}
