import { loadAuthToken } from "@/lib/auth-api";
import { withBasePath } from "@/lib/app-path";
import { supportHubFetch } from "@/lib/support-hub-fetch";
import type { SessionMessageResult, SupportMessage, SupportSession } from "@/lib/support-api";

function agentFetch<T>(path: string, options: RequestInit = {}) {
  return supportHubFetch<T>(path, options);
}

export type AgentPresence = {
  user_id: string;
  status: string;
  last_seen_at: string | null;
  is_online: boolean;
  active_sessions: number;
  display_name?: string;
};

export type AgentDashboard = {
  presence: AgentPresence;
  queue: (SupportSession & { queue_position?: number })[];
  active_sessions: SupportSession[];
};

export async function fetchAgentDashboard() {
  return agentFetch<AgentDashboard>("agents/dashboard", { method: "GET" });
}

export async function fetchClosedSessions() {
  return agentFetch<{ sessions: SupportSession[] }>("agents/sessions/closed", {
    method: "GET",
  });
}

export async function sendAgentHeartbeat() {
  return agentFetch<{ presence: AgentPresence }>("agents/presence/heartbeat", {
    method: "POST",
  });
}

export async function setAgentReady() {
  return agentFetch<{ presence: AgentPresence; message: string }>(
    "agents/presence/ready",
    { method: "POST" },
  );
}

export async function claimQueueSession(sessionId: string) {
  return agentFetch<{ session: SupportSession }>(
    `agents/queue/${sessionId}/claim`,
    { method: "POST" },
  );
}

export async function fetchSessionMessagesAgent(sessionId: string) {
  return agentFetch<{ session: SupportSession; messages: SupportMessage[] }>(
    `sessions/${sessionId}/messages`,
    { method: "GET" },
  );
}

export async function sendAgentMessage(sessionId: string, message: string) {
  return agentFetch<{ agentMessage: SupportMessage; session: SupportSession }>(
    `sessions/${sessionId}/messages`,
    {
      method: "POST",
      body: JSON.stringify({ message }),
    },
  );
}

export async function uploadAgentMessage(
  sessionId: string,
  message: string,
  files: File[],
) {
  const token = loadAuthToken();
  if (!token) throw new Error("Silakan login sebagai implementator.");

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

export async function resolveAgentSession(sessionId: string) {
  return agentFetch<{ session: SupportSession }>(`sessions/${sessionId}/resolve`, {
    method: "POST",
  });
}

export async function handoverSession(
  sessionId: string,
  body: { mode: "direct" | "queue"; to_agent_id?: string; note?: string },
) {
  return agentFetch<{ session: SupportSession; mode: string }>(
    `sessions/${sessionId}/handover`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

export async function promoteSessionToTicket(
  sessionId: string,
  body?: { title?: string; description?: string; priority?: string },
) {
  return agentFetch<{ ticket: { id: string; ticket_number: string }; session: unknown }>(
    `sessions/${sessionId}/promote-ticket`,
    {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    },
  );
}

export async function listHandoverTargets() {
  return agentFetch<{
    agents: { user_id: string; display_name: string; status: string }[];
  }>("agents/available-for-handover", { method: "GET" });
}
