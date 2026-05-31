"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  formatAuthRole,
  userAvatarInitial,
  type AuthUser,
} from "@/lib/auth-api";

type Props = {
  user: AuthUser | null;
  onLogout: () => void;
  /** Baris tambahan di bawah role (mis. status agent). */
  statusLine?: string;
  children?: ReactNode;
  /** Trigger button — `onDark` untuk header teal, `onLight` untuk header putih */
  theme?: "onDark" | "onLight";
};

function UserAvatar({
  user,
  size = "md",
}: {
  user: AuthUser;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "sm"
      ? "h-8 w-8 text-sm"
      : size === "lg"
        ? "h-12 w-12 text-lg"
        : "h-10 w-10 text-base";

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#639B15] to-[#07C5BA] font-semibold text-white shadow-sm ${sizeClass}`}
      aria-hidden
    >
      {userAvatarInitial(user)}
    </span>
  );
}

export function UserMenuLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/90 transition hover:bg-white/10"
    >
      {children}
    </Link>
  );
}

export function UserAccountMenu({
  user,
  onLogout,
  statusLine,
  children,
  theme = "onDark",
}: Props) {
  const triggerClass =
    theme === "onLight"
      ? "text-[#1E1F21] hover:bg-[#F0F1F3]"
      : "text-white/95 hover:bg-white/10";
  const chevronClass = theme === "onLight" ? "text-[#7C828D]" : "text-white/70";
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (!user) return null;

  const close = () => setOpen(false);

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition ${triggerClass}`}
        aria-label="Menu akun"
        aria-expanded={open}
      >
        <UserAvatar user={user} size="sm" />
        <span className="hidden max-w-[120px] truncate text-xs font-medium sm:inline">
          {user.display_name}
        </span>
        <ChevronIcon open={open} className={chevronClass} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-[10002] mt-2 w-[min(100vw-2rem,280px)] overflow-hidden rounded-xl border border-white/10 bg-[#2B2B2B] py-2 text-white shadow-2xl"
          role="menu"
        >
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="relative shrink-0">
              <UserAvatar user={user} size="lg" />
              <span
                className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#2B2B2B] bg-[#639B15]"
                title="Online"
                aria-hidden
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user.display_name}</p>
              <p className="truncate text-xs text-white/60">@{user.username}</p>
              <p className="mt-0.5 text-xs text-[#07C5BA]">{formatAuthRole(user.role)}</p>
              {user.hospital && (
                <p className="mt-0.5 truncate text-[10px] text-white/50">
                  {user.hospital.name} ({user.hospital.code})
                </p>
              )}
              {statusLine && (
                <p className="mt-1 text-[10px] leading-snug text-white/45">{statusLine}</p>
              )}
            </div>
          </div>

          {children ? (
            <>
              <div className="my-2 border-t border-white/10" />
              <div className="px-1" onClick={close}>
                {children}
              </div>
            </>
          ) : null}

          <div className="my-2 border-t border-white/10" />
          <div className="px-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                close();
                onLogout();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/90 transition hover:bg-white/10"
            >
              <LogoutIcon />
              Keluar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ChevronIcon({ open, className = "" }: { open: boolean; className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      className={`shrink-0 transition ${className} ${open ? "rotate-180" : ""}`}
      aria-hidden
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 opacity-80" aria-hidden>
      <path
        d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
