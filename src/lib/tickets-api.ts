import { loadAuthToken } from "@/lib/auth-api";
import { withBasePath } from "@/lib/app-path";

export type TicketAssignee = {
  id: string;
  username: string;
  display_name: string;
  role: string;
};

export type Ticket = {
  id: string;
  ticket_number: string;
  session_id: string | null;
  title: string;
  description: string | null;
  ai_summary: string | null;
  status: string;
  priority: string;
  module: string | null;
  hospital: { id: string; code: string; name: string } | null;
  assignees?: TicketAssignee[];
  assignee_name: string | null;
  assignee_names?: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
};

export type AssignableUser = TicketAssignee;

export function formatAssigneeRole(role: string) {
  if (role === "agent") return "Implementator";
  if (role === "developer") return "Support Dev";
  if (role === "admin") return "Admin";
  return role;
}

export function formatAssigneeLabel(user: TicketAssignee) {
  return `${user.display_name} (${formatAssigneeRole(user.role)})`;
}

async function ticketsFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = loadAuthToken();
  if (!token) throw new Error("Login diperlukan.");

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

export async function fetchTickets(params?: {
  status?: string;
  module?: string;
}) {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  if (params?.module) q.set("module", params.module);
  const qs = q.toString();
  return ticketsFetch<{ tickets: Ticket[] }>(
    `tickets${qs ? `?${qs}` : ""}`,
    { method: "GET" },
  );
}

export async function fetchTicketDetail(id: string) {
  return ticketsFetch<{
    ticket: Ticket;
    comments: {
      id: string;
      body: string;
      visibility: string;
      author_name: string;
      created_at: string;
    }[];
    activities: {
      event_type: string;
      actor_name: string;
      created_at: string;
    }[];
    messages: {
      id: string;
      role: string;
      content: string;
      created_at: string;
    }[];
  }>(`tickets/${id}`, { method: "GET" });
}

export async function fetchAssignableUsers() {
  return ticketsFetch<{ users: AssignableUser[] }>("users/assignable", {
    method: "GET",
  });
}

export async function patchTicket(
  id: string,
  body: Partial<{
    status: string;
    priority: string;
    assignee_id: string;
    assignee_ids: string[];
    ai_summary: string;
  }>,
) {
  return ticketsFetch<{ ticket: Ticket }>(`tickets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function addTicketComment(
  id: string,
  body: string,
  visibility: "internal" | "public",
) {
  return ticketsFetch(`tickets/${id}/comments`, {
    method: "POST",
    body: JSON.stringify({ body, visibility }),
  });
}
