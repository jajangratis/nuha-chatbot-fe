import { supportHubFetch } from "@/lib/support-hub-fetch";

export type ServerNotification = {
  id: string;
  title: string;
  body: string | null;
  href: string;
  type: "info" | "success" | "error";
  read: boolean;
  created_at: string;
};

export async function fetchNotifications(params?: { since?: string; limit?: number }) {
  const q = new URLSearchParams();
  if (params?.since) q.set("since", params.since);
  if (params?.limit) q.set("limit", String(params.limit));
  const qs = q.toString();
  return supportHubFetch<{
    notifications: ServerNotification[];
    unread_count: number;
  }>(`notifications${qs ? `?${qs}` : ""}`, { method: "GET" });
}

export async function markServerNotificationRead(id: string) {
  return supportHubFetch<{ ok: boolean }>(`notifications/${id}/read`, {
    method: "PATCH",
  });
}

export async function markAllServerNotificationsRead() {
  return supportHubFetch<{ ok: boolean }>("notifications/read-all", {
    method: "POST",
  });
}
