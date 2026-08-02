"use client";

import { useEffect, useRef, useState } from "react";
import { formatAuthRole, userAvatarInitial, type AuthUser } from "@/lib/auth-api";

type Props = {
  user: AuthUser;
  onLogout: () => void;
  onSwitchApp?: () => void;
};

const MENU_ITEMS = [
  { id: "profile", label: "User Profile", icon: "person" },
  { id: "switch", label: "Pindah Aplikasi", icon: "person-plus" },
  { id: "pin", label: "Ubah PIN", icon: "lock" },
  { id: "password", label: "Ubah Password", icon: "person-lock" },
  { id: "theme", label: "Pengaturan Tema", icon: "settings" },
  { id: "bug", label: "Report Bug", icon: "toggle" },
] as const;

/** Menu profil header EMR — gaya portal NUHA; Keluar memanggil onLogout. */
export function EmrUserMenu({ user, onLogout, onSwitchApp }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const initial = userAvatarInitial(user);
  const roleLabel = formatAuthRole(user.role);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const onItem = (id: (typeof MENU_ITEMS)[number]["id"]) => {
    if (id === "switch" && onSwitchApp) {
      onSwitchApp();
      setOpen(false);
      return;
    }
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 rounded-md py-1 pl-2 pr-1 text-left transition hover:bg-slate-50"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <div className="leading-tight">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-800">
            {user.display_name}
          </p>
          <p className="text-[11px] text-gray-500">{roleLabel}</p>
        </div>
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1e3a5f] text-sm font-semibold text-white"
          aria-hidden
        >
          {initial}
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 min-w-[220px] overflow-hidden rounded-md border border-gray-100 bg-white py-1 shadow-lg"
        >
          <span
            className="absolute -top-1.5 right-4 h-3 w-3 rotate-45 border-l border-t border-gray-100 bg-white"
            aria-hidden
          />
          {MENU_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              onClick={() => onItem(item.id)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 transition hover:bg-slate-100"
            >
              <MenuIcon kind={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
          <hr className="my-1 border-gray-100" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 transition hover:bg-slate-100"
          >
            <MenuIcon kind="logout" />
            <span>Keluar</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

function MenuIcon({ kind }: { kind: string }) {
  const cls = "h-5 w-5 shrink-0 text-gray-600";
  if (kind === "toggle") {
    return (
      <span className={cls} aria-hidden>
        <span className="inline-flex h-5 w-9 items-center rounded-full bg-gray-300 px-0.5">
          <span className="h-4 w-4 rounded-full bg-white shadow-sm" />
        </span>
      </span>
    );
  }
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      {kind === "person" && (
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      )}
      {kind === "person-plus" && (
        <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      )}
      {kind === "lock" && (
        <path d="M18 8h-1V6a5 5 0 00-10 0v2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V10a2 2 0 00-2-2zm-6 9a2 2 0 110-4 2 2 0 010 4zm3-9H9V6a3 3 0 016 0v2z" />
      )}
      {kind === "person-lock" && (
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zm6.5-1.5l1.41 1.41L19 13.41V16h2v-4h-4v2h2.59l-2.09 2.09z" />
      )}
      {kind === "settings" && (
        <path d="M19.14 12.94a7.43 7.43 0 000-1.88l2.03-1.58a.5.5 0 00.12-.64l-1.92-3.32a.5.5 0 00-.6-.22l-2.39.96a7.28 7.28 0 00-1.63-.94l-.36-2.54a.5.5 0 00-.5-.42h-3.84a.5.5 0 00-.5.42l-.36 2.54a7.28 7.28 0 00-1.63.94l-2.39-.96a.5.5 0 00-.6.22L2.71 8.84a.5.5 0 00.12.64l2.03 1.58a7.43 7.43 0 000 1.88l-2.03 1.58a.5.5 0 00-.12.64l1.92 3.32a.5.5 0 00.6.22l2.39-.96c.5.38 1.04.7 1.63.94l.36 2.54a.5.5 0 00.5.42h3.84a.5.5 0 00.5-.42l.36-2.54c.59-.24 1.13-.56 1.63-.94l2.39.96a.5.5 0 00.6-.22l1.92-3.32a.5.5 0 00-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1112 8a3.5 3.5 0 010 7.5z" />
      )}
      {kind === "logout" && (
        <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4a2 2 0 00-2 2v14a2 2 0 002 2h8v-2H4V5z" />
      )}
    </svg>
  );
}
