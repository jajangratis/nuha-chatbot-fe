import { loadAuthToken } from "@/lib/auth-api";
import { withBasePath } from "@/lib/app-path";

/** Fetch ke BFF /api/v1 — dipakai agent-api, tickets-api, dll. */
export async function supportHubFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = loadAuthToken();
  if (!token) {
    throw new Error("Silakan login terlebih dahulu.");
  }

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(withBasePath(`/api/v1/${path}`), {
    ...options,
    headers,
    cache: "no-store",
  });

  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? `Permintaan gagal (${res.status})`);
  }
  return data;
}
