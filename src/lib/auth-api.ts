import { withBasePath } from "@/lib/app-path";
import type { Hospital } from "@/lib/support-api";

export type AuthUser = {
  id: string;
  username: string;
  email: string | null;
  display_name: string;
  role: "user" | "agent" | "developer" | "admin";
  hospital_id: string | null;
  hospital: Hospital | null;
};

const TOKEN_KEY = "nuha_support_auth_token";
const USER_KEY = "nuha_support_auth_user";

/** Dispar ke useAuthUser saat login/logout di tab yang sama (storage event tidak fire). */
export const AUTH_CHANGE_EVENT = "nuha-auth-change";

function notifyAuthChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  }
}

export function loadAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function loadAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function saveAuth(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  notifyAuthChange();
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  notifyAuthChange();
}

async function authFetch<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth = true, headers: initHeaders, ...rest } = options;
  const headers = new Headers(initHeaders);

  if (rest.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = loadAuthToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const res = await fetch(withBasePath(`/api/v1/${path}`), {
    ...rest,
    headers,
  });

  const data = (await res.json()) as T & { error?: string };

  if (!res.ok) {
    throw new Error(data.error ?? `Permintaan gagal (${res.status})`);
  }

  return data;
}

export async function login(username: string, password: string) {
  const data = await authFetch<{ token: string; user: AuthUser }>("auth/login", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ username, password }),
  });

  saveAuth(data.token, data.user);
  return data;
}

export async function fetchMe() {
  return authFetch<{ user: AuthUser }>("auth/me", { method: "GET" });
}

/** Simpan RS ke profil (role user, sekali). */
export async function updateAuthUserHospital(hospitalId: string) {
  const data = await authFetch<{ user: AuthUser }>("auth/me/hospital", {
    method: "PATCH",
    body: JSON.stringify({ hospital_id: hospitalId }),
  });
  const token = loadAuthToken();
  if (token) {
    saveAuth(token, data.user);
  }
  return data;
}

export function logout() {
  clearAuth();
}

/** Inisial avatar: huruf pertama display_name atau username (kapital). */
/** Halaman utama setelah klik logo (sesuai peran). */
export function defaultHubPathForUser(user: AuthUser | null | undefined): string {
  if (!user) return "/";
  switch (user.role) {
    case "user":
      return "/support";
    case "agent":
    case "admin":
      return "/agent";
    case "developer":
      return "/tickets";
    default:
      return "/";
  }
}

export function userAvatarInitial(user: Pick<AuthUser, "display_name" | "username">): string {
  const src = user.display_name?.trim() || user.username?.trim() || "?";
  return src.charAt(0).toUpperCase();
}

export function formatAuthRole(role: AuthUser["role"]): string {
  switch (role) {
    case "agent":
      return "IT Implementator";
    case "developer":
      return "Support Developer";
    case "admin":
      return "Admin";
    case "user":
      return "User RS";
    default:
      return role;
  }
}
