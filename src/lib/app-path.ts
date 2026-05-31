/** Prefix path saat app di belakang reverse proxy subpath (mis. /chatbot) */
export function getBasePath(): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  if (!base || base === "/") return "";
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

export function withBasePath(path: string): string {
  const base = getBasePath();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

/**
 * Path untuk next/link & router.push — tanpa basePath (Next menambahkan otomatis).
 * Jika href sudah memuat basePath (data lama / withBasePath), prefix dibuang.
 */
export function appPath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return "/";

  let pathname = trimmed;
  let search = "";
  let hash = "";

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const u = new URL(trimmed);
      pathname = u.pathname;
      search = u.search;
      hash = u.hash;
    } catch {
      return "/";
    }
  } else {
    const q = trimmed.indexOf("?");
    const h = trimmed.indexOf("#");
    const cut = Math.min(
      q === -1 ? trimmed.length : q,
      h === -1 ? trimmed.length : h,
    );
    pathname = trimmed.slice(0, cut) || "/";
    search = q === -1 ? "" : trimmed.slice(q, h === -1 ? undefined : h);
    hash = h === -1 ? "" : trimmed.slice(h);
  }

  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const base = getBasePath();
  let route = normalized;
  if (base) {
    if (route === base) route = "/";
    else if (route.startsWith(`${base}/`)) route = route.slice(base.length) || "/";
  }

  return `${route}${search}${hash}`;
}

/** Normalisasi href notifikasi (API / localStorage) ke path navigasi App Router. */
export function normalizeNotificationHref(href: string): string {
  return appPath(href);
}
