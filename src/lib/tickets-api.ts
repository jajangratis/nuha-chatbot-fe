import { loadAuthToken } from "@/lib/auth-api";
import { withBasePath } from "@/lib/app-path";
import { supportHubFetch } from "@/lib/support-hub-fetch";
import type { TicketPriority } from "@/lib/ticket-priority";

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
  priority: TicketPriority | string;
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

function ticketsFetch<T>(path: string, options: RequestInit = {}) {
  return supportHubFetch<T>(path, options);
}

export async function fetchTickets(params?: {
  status?: string;
  priority?: string;
  module?: string;
}) {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  if (params?.priority) q.set("priority", params.priority);
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

export type TicketAttachment = {
  id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  url: string;
};

export async function patchTicket(
  id: string,
  body: Partial<{
    status: string;
    priority: TicketPriority | string;
    assignee_id: string;
    assignee_ids: string[];
    ai_summary: string;
    description: string;
  }>,
) {
  return ticketsFetch<{ ticket: Ticket }>(`tickets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function uploadTicketDescriptionImage(ticketId: string, file: File) {
  const token = loadAuthToken();
  if (!token) throw new Error("Silakan login.");

  const fd = new FormData();
  fd.append("file", file);

  const headers = new Headers();
  headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(withBasePath(`/api/v1/tickets/${ticketId}/attachments`), {
    method: "POST",
    headers,
    body: fd,
  });

  const data = (await res.json()) as { attachment?: TicketAttachment; error?: string };
  if (!res.ok || !data.attachment) {
    throw new Error(data.error ?? `Upload gagal (${res.status})`);
  }
  return { attachment: data.attachment };
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
