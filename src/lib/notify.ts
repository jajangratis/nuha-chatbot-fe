import { withBasePath } from "@/lib/app-path";

export type AppNotification = {
  id: string;
  title: string;
  body?: string;
  type?: "info" | "success" | "error";
  href: string;
  read: boolean;
  createdAt: number;
};

type Listener = (items: AppNotification[]) => void;

const STORAGE_KEY = "nuha_support_notifications";
const MAX_ITEMS = 40;

let items: AppNotification[] = [];
const listeners = new Set<Listener>();

/** Popup sementara — terpisah dari daftar lonceng (tidak mengikuti status unread). */
let toasts: AppNotification[] = [];
const toastListeners = new Set<Listener>();
const toastTimers = new Map<string, ReturnType<typeof setTimeout>>();

const TOAST_AUTO_DISMISS_MS = 6_000;
const MAX_TOASTS = 3;

function emitToasts() {
  const snapshot = toasts;
  queueMicrotask(() => {
    toastListeners.forEach((fn) => fn(snapshot));
  });
}

function scheduleToastDismiss(id: string) {
  const prev = toastTimers.get(id);
  if (prev) clearTimeout(prev);
  const t = setTimeout(() => {
    toastTimers.delete(id);
    dismissToast(id);
  }, TOAST_AUTO_DISMISS_MS);
  toastTimers.set(id, t);
}

export function subscribeToasts(fn: (items: AppNotification[]) => void) {
  toastListeners.add(fn);
  fn(toasts);
  return () => {
    toastListeners.delete(fn);
  };
}

export function showToast(item: AppNotification) {
  toasts = [item, ...toasts.filter((t) => t.id !== item.id)].slice(0, MAX_TOASTS);
  emitToasts();
  scheduleToastDismiss(item.id);
}

export function dismissToast(id: string) {
  const timer = toastTimers.get(id);
  if (timer) {
    clearTimeout(timer);
    toastTimers.delete(id);
  }
  toasts = toasts.filter((t) => t.id !== id);
  emitToasts();
}

export function dismissAllToasts() {
  for (const timer of toastTimers.values()) clearTimeout(timer);
  toastTimers.clear();
  toasts = [];
  emitToasts();
}

function loadStored(): AppNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AppNotification[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStored() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* quota */
  }
}

function emit() {
  listeners.forEach((fn) => fn(items));
  saveStored();
}

function ensureHydrated() {
  if (items.length === 0 && typeof window !== "undefined") {
    items = loadStored();
  }
}

export function agentSessionHref(sessionId: string) {
  return withBasePath(`/agent?session=${encodeURIComponent(sessionId)}`);
}

export function supportSessionHref(sessionId: string) {
  return withBasePath(`/support?session=${encodeURIComponent(sessionId)}`);
}

export function ticketHref(ticketId: string) {
  return withBasePath(`/tickets/${ticketId}`);
}

export function subscribeNotifications(fn: Listener) {
  ensureHydrated();
  listeners.add(fn);
  fn(items);
  return () => {
    listeners.delete(fn);
  };
}

export function getUnreadNotificationCount() {
  ensureHydrated();
  return items.filter((n) => !n.read).length;
}

export function dismissNotification(id: string) {
  dismissToast(id);
  ensureHydrated();
  items = items.filter((n) => n.id !== id);
  emit();
}

export function markNotificationRead(id: string) {
  dismissToast(id);
  ensureHydrated();
  items = items.map((n) => (n.id === id ? { ...n, read: true } : n));
  emit();
}

export function markAllNotificationsRead() {
  dismissAllToasts();
  ensureHydrated();
  items = items.map((n) => ({ ...n, read: true }));
  emit();
}

export function clearAllNotifications() {
  items = items.filter((n) => !n.id.startsWith("srv-"));
  emit();
}

export function serverNotificationId(serverId: string) {
  return `srv-${serverId}`;
}

export function isServerNotificationId(id: string) {
  return id.startsWith("srv-");
}

export function serverNotificationIdRaw(id: string) {
  return id.startsWith("srv-") ? id.slice(4) : id;
}

/** Gabungkan notifikasi dari API (tiket) dengan notifikasi lokal (chat). */
export function syncServerNotifications(
  serverItems: {
    id: string;
    title: string;
    body: string | null;
    href: string;
    type: string;
    read: boolean;
    created_at: string;
  }[],
) {
  ensureHydrated();
  const prevServerIds = new Set(
    items.filter((n) => isServerNotificationId(n.id)).map((n) => n.id),
  );
  const localOnly = items.filter((n) => !isServerNotificationId(n.id));
  const fromServer = serverItems.map((n) => ({
    id: serverNotificationId(n.id),
    title: n.title,
    body: n.body ?? undefined,
    type: (["info", "success", "error"].includes(n.type)
      ? n.type
      : "info") as AppNotification["type"],
    href: n.href.startsWith("/") ? withBasePath(n.href) : withBasePath(`/${n.href}`),
    read: n.read,
    createdAt: new Date(n.created_at).getTime(),
  }));

  items = [...fromServer, ...localOnly]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, MAX_ITEMS);
  emit();

  for (const n of items) {
    if (isServerNotificationId(n.id) && !prevServerIds.has(n.id) && !n.read) {
      showToast(n);
    }
  }
}

export function pushNotification(
  input: Omit<AppNotification, "id" | "read" | "createdAt"> & {
    id?: string;
    read?: boolean;
    createdAt?: number;
  },
  options?: { browser?: boolean },
) {
  ensureHydrated();
  const item: AppNotification = {
    id: input.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: input.title,
    body: input.body,
    type: input.type ?? "info",
    href: input.href,
    read: input.read ?? false,
    createdAt: input.createdAt ?? Date.now(),
  };

  items = [item, ...items.filter((n) => n.id !== item.id)].slice(0, MAX_ITEMS);
  emit();

  if (!item.read) {
    showToast(item);
  }

  if (options?.browser !== false && typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "granted") {
      new Notification(item.title, { body: item.body, tag: item.id });
    }
  }

  return item.id;
}

export async function requestNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied" as NotificationPermission;
  }
  if (Notification.permission === "default") {
    return Notification.requestPermission();
  }
  return Notification.permission;
}

/** Notify when pesan baru dari lawan bicara terdeteksi saat polling */
export function notifyNewChatMessages(
  messages: { id: string; role: string; content: string }[],
  knownIds: Set<string>,
  options: {
    myRoles: string[];
    peerLabel: string;
    onlyWhenHidden?: boolean;
    /** Default: halaman beranda (tamu) */
    href?: string;
  },
) {
  const targetHref = options.href ?? withBasePath("/");
  const tabVisible =
    typeof document !== "undefined" && !document.hidden;
  const skipBrowser = options.onlyWhenHidden === true && tabVisible;

  for (const msg of messages) {
    if (knownIds.has(msg.id)) continue;
    knownIds.add(msg.id);
    if (!options.myRoles.includes(msg.role)) {
      pushNotification(
        {
          id: `msg-${msg.id}`,
          title: options.peerLabel,
          body: msg.content.slice(0, 120),
          type: "info",
          href: targetHref,
        },
        { browser: !skipBrowser },
      );
    }
  }
}
