"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { appPath, normalizeNotificationHref } from "@/lib/app-path";
import {
  dismissToast,
  isServerNotificationId,
  markNotificationRead,
  serverNotificationIdRaw,
  subscribeToasts,
  type AppNotification,
} from "@/lib/notify";
import { markServerNotificationRead } from "@/lib/notifications-api";

const TYPE_STYLES: Record<NonNullable<AppNotification["type"]>, string> = {
  info: "border-[#014547]/20 bg-white text-[#0B1D15]",
  success: "border-[#639B15]/30 bg-[#F6FBEF]",
  error: "border-red-200 bg-red-50 text-red-900",
};

export function NotificationToasts() {
  const [items, setItems] = useState<AppNotification[]>([]);

  useEffect(() => subscribeToasts(setItems), []);

  if (!items.length) return null;

  return (
    <div
      className="pointer-events-none fixed right-4 top-4 z-[9990] flex w-[min(100vw-2rem,360px)] flex-col gap-2"
      aria-live="polite"
    >
      {items.map((n) => {
        const to = appPath(normalizeNotificationHref(n.href));
        return (
        <div
          key={n.id}
          className={`pointer-events-auto rounded-xl border px-4 py-3 shadow-lg ${TYPE_STYLES[n.type ?? "info"]}`}
        >
          <div className="flex items-start justify-between gap-2">
            <Link
              href={to}
              onClick={() => {
                if (isServerNotificationId(n.id)) {
                  void markServerNotificationRead(serverNotificationIdRaw(n.id));
                } else {
                  markNotificationRead(n.id);
                }
                dismissToast(n.id);
              }}
              className="min-w-0 flex-1 text-left hover:opacity-90"
            >
              <p className="text-sm font-semibold">{n.title}</p>
              {n.body && (
                <p className="mt-0.5 line-clamp-2 text-xs opacity-90">{n.body}</p>
              )}
              <p className="mt-1 text-[10px] text-[#07C5BA]">Ketuk untuk buka →</p>
            </Link>
            <button
              type="button"
              onClick={() => dismissToast(n.id)}
              className="shrink-0 text-lg leading-none opacity-50 hover:opacity-100"
              aria-label="Tutup"
            >
              ×
            </button>
          </div>
        </div>
      );
      })}
    </div>
  );
}
