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

export type TicketsPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export async function fetchTickets(params?: {
  status?: string;
  priority?: string;
  module?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}) {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  if (params?.priority) q.set("priority", params.priority);
  if (params?.module) q.set("module", params.module);
  if (params?.date_from) q.set("date_from", params.date_from);
  if (params?.date_to) q.set("date_to", params.date_to);
  if (params?.page != null) q.set("page", String(params.page));
  if (params?.limit != null) q.set("limit", String(params.limit));
  const qs = q.toString();
  return ticketsFetch<{ tickets: Ticket[]; pagination?: TicketsPagination }>(
    `tickets${qs ? `?${qs}` : ""}`,
    { method: "GET" },
  );
}

export type TicketChatMessage = {
  id: string;
  role: string;
  content: string;
  metadata?: unknown;
  created_at: string;
};

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
    messages: TicketChatMessage[];
    ticket_chat_open: boolean;
    has_session: boolean;
  }>(`tickets/${id}`, { method: "GET" });
}

export async function sendTicketChatMessage(ticketId: string, message: string) {
  return ticketsFetch<{ message: TicketChatMessage }>(`tickets/${ticketId}/messages`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export async function uploadTicketChatMessage(
  ticketId: string,
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

  const res = await fetch(withBasePath(`/api/v1/tickets/${ticketId}/messages`), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });

  const data = (await res.json()) as { message?: TicketChatMessage; error?: string };
  if (!res.ok || !data.message) {
    throw new Error(data.error ?? `Permintaan gagal (${res.status})`);
  }
  return { message: data.message };
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
    title: string;
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

export async function addTicketComment(id: string, body: string) {
  return ticketsFetch(`tickets/${id}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}
