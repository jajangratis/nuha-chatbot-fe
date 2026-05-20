const NUHA_ORIGIN = "https://nuha.care";

export const NUHA_CHROME_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent": NUHA_CHROME_UA,
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
  "Accept-Encoding": "gzip, deflate",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  "Sec-Ch-Ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"macOS"',
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mergeCookies(existing: string, setCookieHeaders: string[]): string {
  const jar = new Map<string, string>();

  for (const part of existing.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf("=");
    if (eq > 0) jar.set(trimmed.slice(0, eq), trimmed.slice(eq + 1));
  }

  for (const header of setCookieHeaders) {
    const pair = header.split(";")[0]?.trim();
    if (!pair) continue;
    const eq = pair.indexOf("=");
    if (eq > 0) jar.set(pair.slice(0, eq), pair.slice(eq + 1));
  }

  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

function collectSetCookies(res: Response): string[] {
  const headers = res.headers as Headers & {
    getSetCookie?: () => string[];
  };
  if (typeof headers.getSetCookie === "function") {
    return headers.getSetCookie();
  }
  const single = res.headers.get("set-cookie");
  return single ? [single] : [];
}

/** Respons WAF SafeLine (403 atau HTML blokir) */
export function isBlockedNuhaResponse(html: string, status: number): boolean {
  if (status === 403 || status === 429 || status === 503) return true;
  if (
    html.includes("slg-bg") ||
    html.includes("SafeLine") ||
    html.includes("Protected By") ||
    html.includes("security detection")
  ) {
    return true;
  }
  if (!html.includes("__NEXT_DATA__") && html.length < 8000) {
    return true;
  }
  return false;
}

export type NuhaFetchResult =
  | { ok: true; html: string }
  | { ok: false; status: number; reason: string };

/**
 * Fetch nuha.care dengan retry, cookie session WAF, dan header browser lengkap.
 */
export async function fetchNuhaCareHtml(
  path = "/",
  options?: { cookie?: string; retries?: number },
): Promise<NuhaFetchResult> {
  const safePath = path.startsWith("/") ? path : `/${path}`;
  const target = `${NUHA_ORIGIN}${safePath === "/" ? "" : safePath}`;
  const maxRetries = options?.retries ?? 3;
  let cookie = options?.cookie ?? "";

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      await sleep(400 * attempt);
    }

    try {
      const res = await fetch(target, {
        headers: {
          ...BROWSER_HEADERS,
          Referer: NUHA_ORIGIN + "/",
          ...(cookie ? { Cookie: cookie } : {}),
        },
        cache: "no-store",
        redirect: "follow",
      });

      cookie = mergeCookies(cookie, collectSetCookies(res));
      const html = await res.text();

      if (!isBlockedNuhaResponse(html, res.status)) {
        return { ok: true, html };
      }

      if (attempt === maxRetries - 1) {
        return {
          ok: false,
          status: res.status,
          reason: "blocked",
        };
      }
    } catch {
      if (attempt === maxRetries - 1) {
        return { ok: false, status: 0, reason: "network" };
      }
    }
  }

  return { ok: false, status: 403, reason: "blocked" };
}
