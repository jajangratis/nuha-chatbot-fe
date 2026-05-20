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
