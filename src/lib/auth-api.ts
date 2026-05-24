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
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
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

export function logout() {
  clearAuth();
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
