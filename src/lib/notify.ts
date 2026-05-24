export type AppNotification = {
  id: string;
  title: string;
  body?: string;
  type?: "info" | "success" | "error";
};

type Listener = (items: AppNotification[]) => void;

let items: AppNotification[] = [];
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((fn) => fn(items));
}

export function subscribeNotifications(fn: Listener) {
  listeners.add(fn);
  fn(items);
  return () => {
    listeners.delete(fn);
  };
}

export function dismissNotification(id: string) {
  items = items.filter((n) => n.id !== id);
  emit();
}

export function pushNotification(
  input: Omit<AppNotification, "id"> & { id?: string },
) {
  const item: AppNotification = {
    id: input.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: input.title,
    body: input.body,
    type: input.type ?? "info",
  };
  items = [...items.slice(-5), item];
  emit();

  if (typeof window !== "undefined" && "Notification" in window) {
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
  },
) {
  if (options.onlyWhenHidden && typeof document !== "undefined" && !document.hidden) {
    messages.forEach((m) => knownIds.add(m.id));
    return;
  }

  for (const msg of messages) {
    if (knownIds.has(msg.id)) continue;
    knownIds.add(msg.id);
    if (!options.myRoles.includes(msg.role)) {
      pushNotification({
        title: options.peerLabel,
        body: msg.content.slice(0, 120),
        type: "info",
      });
    }
  }
}
