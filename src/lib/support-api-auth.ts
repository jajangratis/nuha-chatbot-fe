import { loadAuthToken } from "@/lib/auth-api";
import { withBasePath } from "@/lib/app-path";
import type {
  SessionMessageResult,
  SupportMessage,
  SupportSession,
} from "@/lib/support-api";

async function authedSupportFetch<T>(
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
  });

  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? `Permintaan gagal (${res.status})`);
  }
  return data;
}

export async function listAuthSessions() {
  return authedSupportFetch<{ sessions: SupportSession[] }>("sessions", {
    method: "GET",
  });
}

export type CreateAuthSessionOptions = {
  module?: string;
  hospital_id?: string;
};

export async function createAuthSession(options?: CreateAuthSessionOptions | string) {
  const opts: CreateAuthSessionOptions =
    typeof options === "string" ? { module: options } : (options ?? {});
  const body: Record<string, string> = {};
  if (opts.module) body.module = opts.module;
  if (opts.hospital_id) body.hospital_id = opts.hospital_id;

  return authedSupportFetch<{
    session: SupportSession;
    hospital: SupportSession["hospital"];
  }>("sessions", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function fetchAuthSessionMessages(sessionId: string) {
  return authedSupportFetch<{
    session: SupportSession;
    messages: SupportMessage[];
  }>(`sessions/${sessionId}/messages`, { method: "GET" });
}

export async function escalateAuthSession(sessionId: string) {
  return authedSupportFetch<{
    session: SupportSession;
    assigned: boolean;
    agent: { id: string; display_name: string } | null;
    queue_position: number | null;
  }>(`sessions/${sessionId}/escalate`, {
    method: "POST",
  });
}

export async function sendAuthSessionMessage(sessionId: string, message: string) {
  return authedSupportFetch<SessionMessageResult>(`sessions/${sessionId}/messages`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export async function uploadAuthSessionMessage(
  sessionId: string,
  message: string,
  files: File[],
) {
  const token = loadAuthToken();
  if (!token) throw new Error("Silakan login terlebih dahulu.");

  const fd = new FormData();
  if (message.trim()) fd.append("message", message.trim());
  for (const file of files) {
    fd.append("files", file);
  }

  const headers = new Headers();
  headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(withBasePath(`/api/v1/sessions/${sessionId}/messages/upload`), {
    method: "POST",
    headers,
    body: fd,
  });

  const data = (await res.json()) as SessionMessageResult & { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? `Permintaan gagal (${res.status})`);
  }
  return data;
}
