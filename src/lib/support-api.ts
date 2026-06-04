import { withBasePath } from "@/lib/app-path";

export type Hospital = {
  id: string;
  code: string;
  name: string;
  source: "master" | "guest_custom";
  is_verified: boolean;
};

export type SupportSession = {
  id: string;
  status: string;
  module: string | null;
  hospital: Hospital | null;
  guest_name?: string | null;
  assigned_agent_id?: string | null;
  assigned_agent_name?: string | null;
  queue_position?: number | null;
  handover_status?: string;
  last_user_message_at?: string | null;
  last_activity_at?: string | null;
  unread_user_count?: number;
  ticket_id?: string | null;
  ticket_number?: string | null;
  ticket_created_at?: string | null;
  ticket_status?: string | null;
  closed_at?: string | null;
  close_reason?: string | null;
  created_at: string;
  updated_at?: string;
};

export type SupportMessage = {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "agent" | "system";
  content: string;
  metadata?: {
    sources?: unknown[];
    retrievalLatencyMs?: number;
    answerMode?: string;
    finishReason?: string;
  } | null;
  read_at?: string | null;
  created_at: string;
};

const STORAGE_KEY = "nuha_support_guest";

export type StoredGuestSession = {
  sessionId: string;
  guestSessionToken: string;
  hospital?: Hospital;
  guestName?: string;
};

export function loadStoredGuestSession(): StoredGuestSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredGuestSession;
  } catch {
    return null;
  }
}

export function saveStoredGuestSession(data: StoredGuestSession) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearStoredGuestSession() {
  sessionStorage.removeItem(STORAGE_KEY);
}

async function supportFetch<T>(
  path: string,
  options: RequestInit & { guestToken?: string } = {},
): Promise<T> {
  const { guestToken, headers: initHeaders, ...rest } = options;
  const headers = new Headers(initHeaders);

  if (guestToken) {
    headers.set("X-Guest-Session-Token", guestToken);
  }

  if (rest.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(withBasePath(`/api/v1/${path}`), {
    ...rest,
    headers,
  });

  const data = (await res.json()) as T & { error?: string };

  if (!res.ok) {
    throw new Error(
      (data as { error?: string }).error ?? `Permintaan gagal (${res.status})`,
    );
  }

  return data;
}

export async function fetchHospitals(q?: string) {
  const query = q ? `?q=${encodeURIComponent(q)}` : "";
  const data = await supportFetch<{ hospitals: Hospital[] }>(
    `hospitals${query}`,
    { method: "GET" },
  );
  return data.hospitals;
}

export async function fetchHospitalByCode(code: string) {
  const data = await supportFetch<{ hospital: Hospital }>(
    `hospitals/by-code/${encodeURIComponent(code)}`,
    { method: "GET" },
  );
  return data.hospital;
}

export async function createGuestSession(body: {
  guest_name: string;
  hospital_id?: string;
  hospital_custom_name?: string;
  module?: string;
}) {
  return supportFetch<{
    session: SupportSession;
    guest_session_token: string;
    hospital: Hospital;
  }>("sessions", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function fetchSession(sessionId: string, guestToken: string) {
  return supportFetch<{
    session: SupportSession;
    isClosed: boolean;
    idleWarning: boolean;
    idleMinutesRemaining: number | null;
  }>(`sessions/${sessionId}`, {
    method: "GET",
    guestToken,
  });
}

export async function fetchSessionMessages(sessionId: string, guestToken: string) {
  return supportFetch<{
    session: SupportSession;
    messages: SupportMessage[];
    idleWarning: boolean;
    idleMinutesRemaining: number | null;
  }>(`sessions/${sessionId}/messages`, {
    method: "GET",
    guestToken,
  });
}

export async function escalateSession(sessionId: string, guestToken: string) {
  return supportFetch<{
    session: SupportSession;
    assigned: boolean;
    agent: { id: string; display_name: string } | null;
    queue_position: number | null;
  }>(`sessions/${sessionId}/escalate`, {
    method: "POST",
    guestToken,
  });
}

export type SessionMessageResult = {
  userMessage: SupportMessage;
  assistantMessage?: SupportMessage;
  agentMessage?: SupportMessage;
  session: SupportSession;
  idleWarning?: boolean;
  idleMinutesRemaining?: number | null;
  awaiting_agent?: boolean;
  queue_position?: number | null;
  rag?: {
    sources?: unknown[];
    retrievalLatencyMs?: number;
    answerMode?: string;
  };
};

export async function sendSessionMessage(
  sessionId: string,
  guestToken: string,
  message: string,
) {
  return supportFetch<SessionMessageResult>(`sessions/${sessionId}/messages`, {
    method: "POST",
    guestToken,
    body: JSON.stringify({ message }),
  });
}

export async function uploadSessionMessage(
  sessionId: string,
  guestToken: string,
  message: string,
  files: File[],
) {
  const fd = new FormData();
  if (message.trim()) fd.append("message", message.trim());
  for (const file of files) {
    fd.append("files", file);
  }

  const headers = new Headers();
  headers.set("X-Guest-Session-Token", guestToken);

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
