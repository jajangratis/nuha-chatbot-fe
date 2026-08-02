"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { loadAuthToken } from "@/lib/auth-api";
import { appPath, normalizeNotificationHref } from "@/lib/app-path";
import {
  fetchNotifications,
  markAllServerNotificationsRead,
  markServerNotificationRead,
} from "@/lib/notifications-api";
import {
  dismissAllToasts,
  isServerNotificationId,
  markAllNotificationsRead,
  markNotificationRead,
  serverNotificationIdRaw,
  subscribeNotifications,
  syncServerNotifications,
  type AppNotification,
} from "@/lib/notify";

function formatTime(ts: number) {
  return new Date(ts).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const TYPE_DOT: Record<NonNullable<AppNotification["type"]>, string> = {
  info: "bg-[#07C5BA]",
  success: "bg-[#639B15]",
  error: "bg-red-500",
};

const POLL_MS = 20_000;

type Props = {
  theme?: "onDark" | "onLight";
};

export function NotificationBell({ theme = "onDark" }: Props) {
  const iconBtnClass =
    theme === "onLight"
      ? "text-[#1E1F21] hover:bg-[#F0F1F3]"
      : "text-white/90 hover:bg-white/10";
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => subscribeNotifications(setItems), []);

  const pollServer = useCallback(async () => {
    if (!loadAuthToken()) return;
    try {
      const { notifications } = await fetchNotifications({ limit: 40 });
      syncServerNotifications(notifications);
    } catch {
      /* offline / guest */
    }
  }, []);

  useEffect(() => {
    void pollServer();
    const t = setInterval(() => void pollServer(), POLL_MS);
    return () => clearInterval(t);
  }, [pollServer]);

  useEffect(() => {
    if (open) void pollServer();
  }, [open, pollServer]);

  useEffect(() => {
    if (!open) return;
    dismissAllToasts();
    const onDoc = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const unread = items.filter((n) => !n.read).length;

  const markRead = useCallback(async (n: AppNotification) => {
    if (isServerNotificationId(n.id)) {
      try {
        await markServerNotificationRead(serverNotificationIdRaw(n.id));
      } catch {
        /* ignore */
      }
    } else {
      markNotificationRead(n.id);
    }
  }, []);

  const onMarkAllRead = useCallback(async () => {
    markAllNotificationsRead();
    if (loadAuthToken()) {
      try {
        await markAllServerNotificationsRead();
        await pollServer();
      } catch {
        /* ignore */
      }
    }
  }, [pollServer]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`relative rounded-lg p-2 ${iconBtnClass}`}
        aria-label="Notifikasi"
        aria-expanded={open}
      >
        <BellIcon />
        {unread > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#AAE053] px-1 text-[10px] font-bold text-[#032626]">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-[10001] mt-2 flex w-[min(100vw-2rem,360px)] flex-col overflow-hidden rounded-xl border border-[#E8E8E8] bg-white shadow-xl"
          role="dialog"
          aria-label="Daftar notifikasi"
        >
          <div className="flex items-center justify-between border-b border-[#F0F0F0] px-3 py-2">
            <p className="text-sm font-semibold text-[#014547]">Notifikasi</p>
            <div className="flex gap-2 text-[10px]">
              {unread > 0 && (
                <button
                  type="button"
                  onClick={() => void onMarkAllRead()}
                  className="text-[#07C5BA] hover:underline"
                >
                  Tandai dibaca
                </button>
              )}
            </div>
          </div>

          <ul className="max-h-[min(70vh,400px)] overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-4 py-8 text-center text-xs text-[#717171]">
                Belum ada notifikasi
              </li>
            ) : (
              items.map((n) => {
                const to = appPath(normalizeNotificationHref(n.href));
                return (
                <li key={n.id}>
                  <Link
                    href={to}
                    onClick={() => {
                      void markRead(n);
                      setOpen(false);
                    }}
                    className={`flex w-full gap-2 border-b border-[#F5F5F5] px-3 py-3 text-left transition hover:bg-[#F9F9F9] ${
                      n.read ? "opacity-70" : "bg-[#F6FBEF]/40"
                    }`}
                  >
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TYPE_DOT[n.type ?? "info"]}`}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium text-[#0B1D15]">{n.title}</span>
                        {!n.read && (
                          <span className="shrink-0 text-[9px] font-semibold uppercase text-[#639B15]">
                            Baru
                          </span>
                        )}
                      </span>
                      {n.body && (
                        <span className="mt-0.5 line-clamp-2 block text-xs text-[#717171]">
                          {n.body}
                        </span>
                      )}
                      <span className="mt-1 block text-[10px] text-[#A0A0A0]">
                        {formatTime(n.createdAt)}
                      </span>
                    </span>
                  </Link>
                </li>
              );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"
        fill="currentColor"
      />
    </svg>
  );
}
