"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  dismissNotification,
  isServerNotificationId,
  markNotificationRead,
  serverNotificationIdRaw,
  subscribeNotifications,
  type AppNotification,
} from "@/lib/notify";
import { markServerNotificationRead } from "@/lib/notifications-api";

const TYPE_STYLES: Record<NonNullable<AppNotification["type"]>, string> = {
  info: "border-[#014547]/20 bg-white text-[#0B1D15]",
  success: "border-[#639B15]/30 bg-[#F6FBEF]",
  error: "border-red-200 bg-red-50 text-red-900",
};

export function NotificationToasts() {
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);

  useEffect(() => {
    return subscribeNotifications(setItems);
  }, []);

  const recent = items.filter((n) => !n.read).slice(0, 3);

  if (!recent.length) return null;

  return (
    <div
      className="pointer-events-none fixed right-4 top-4 z-[10000] flex w-[min(100vw-2rem,360px)] flex-col gap-2"
      aria-live="polite"
    >
      {recent.map((n) => (
        <div
          key={n.id}
          className={`pointer-events-auto rounded-xl border px-4 py-3 shadow-lg ${TYPE_STYLES[n.type ?? "info"]}`}
        >
          <div className="flex items-start justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                if (isServerNotificationId(n.id)) {
                  void markServerNotificationRead(serverNotificationIdRaw(n.id));
                } else {
                  markNotificationRead(n.id);
                }
                router.push(n.href);
              }}
              className="min-w-0 flex-1 text-left hover:opacity-90"
            >
              <p className="text-sm font-semibold">{n.title}</p>
              {n.body && (
                <p className="mt-0.5 line-clamp-2 text-xs opacity-90">{n.body}</p>
              )}
              <p className="mt-1 text-[10px] text-[#07C5BA]">Ketuk untuk buka →</p>
            </button>
            <button
              type="button"
              onClick={() => dismissNotification(n.id)}
              className="shrink-0 text-lg leading-none opacity-50 hover:opacity-100"
              aria-label="Tutup"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
