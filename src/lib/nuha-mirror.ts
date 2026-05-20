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

/** Hanya hapus script inline berbahaya; pertahankan bundle & __NEXT_DATA__ */
function preserveNuhaScripts(html: string): string {
  return html.replace(
    /<script\b([^>]*)>([\s\S]*?)<\/script>/gi,
    (tag, attrs: string) => {
      if (/src\s*=\s*["']/i.test(attrs)) {
        return tag.replace(
          /src=["']([^"']+)["']/i,
          (_, src: string) => `src="${absolutize(src)}"`,
        );
      }
      if (/id=["']__NEXT_DATA__["']/i.test(attrs)) {
        return tag;
      }
      if (/type=["']application\/json["']/i.test(attrs)) {
        return tag;
      }
      return "";
    },
  );
}

function injectBaseTag(html: string): string {
  const base = `<base href="${NUHA_ORIGIN}/">`;
  if (/<base\s/i.test(html)) {
    return html.replace(/<base[^>]*>/i, base);
  }
  return html.replace(/<head([^>]*)>/i, `<head$1>${base}`);
}

export type NuhaMirrorContent = {
  bodyHtml: string;
  styleLinks: string[];
};

import { fetchNuhaCareHtml } from "@/lib/nuha-fetch";

export async function fetchNuhaMirror(path = "/"): Promise<NuhaMirrorContent> {
  const result = await fetchNuhaCareHtml(path, { retries: 3 });

  if (!result.ok) {
    throw new Error(`Gagal memuat halaman Nuha (${result.status || result.reason})`);
  }

  return transformNuhaHtml(result.html);
}

/** Dokumen HTML lengkap untuk iframe proxy — script & CSS asli tetap jalan */
export function transformNuhaDocument(html: string): string {
  let doc = html;
  doc = preserveNuhaScripts(doc);
  doc = absolutizeAttributes(doc);
  doc = injectBaseTag(doc);
  return doc;
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

  bodyHtml = preserveNuhaScripts(bodyHtml);
  bodyHtml = absolutizeAttributes(bodyHtml);

  return {
    bodyHtml,
    styleLinks: [...new Set(styleLinks)],
  };
}
