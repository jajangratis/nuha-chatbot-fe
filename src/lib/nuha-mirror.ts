const NUHA_ORIGIN = "https://nuha.care";

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

export type NuhaMirrorContent = {
  bodyHtml: string;
  styleLinks: string[];
};

export async function fetchNuhaMirror(path = "/"): Promise<NuhaMirrorContent> {
  const url = `${NUHA_ORIGIN}${path === "/" ? "" : path}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; NuhaCareClone/1.0)",
      Accept: "text/html,application/xhtml+xml",
    },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`Gagal memuat halaman Nuha (${res.status})`);
  }

  return transformNuhaHtml(await res.text());
}

export function transformNuhaHtml(html: string): NuhaMirrorContent {
  const styleLinks: string[] = [];
  const linkRegex = /<link[^>]+rel=["']stylesheet["'][^>]*>/gi;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(html)) !== null) {
    const hrefMatch = match[0].match(/href=["']([^"']+)["']/i);
    if (hrefMatch?.[1]) {
      styleLinks.push(absolutize(hrefMatch[1]));
    }
  }

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  let bodyHtml = bodyMatch?.[1] ?? html;

  bodyHtml = bodyHtml.replace(/<script\b[\s\S]*?<\/script>/gi, "");
  bodyHtml = absolutizeAttributes(bodyHtml);

  return {
    bodyHtml,
    styleLinks: [...new Set(styleLinks)],
  };
}
