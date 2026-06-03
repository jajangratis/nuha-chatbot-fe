"use client";

import type { AuthUser } from "@/lib/auth-api";
import { EmrUserMenu } from "@/components/emr/EmrUserMenu";
import { EMR_THEME } from "@/components/emr/emr-theme";

type Props = {
  user: AuthUser;
  onLogout: () => void;
  onSwitchApp: () => void;
};

export function EmrDashboardHeader({ user, onLogout, onSwitchApp }: Props) {
  return (
    <header
      className="flex h-12 shrink-0 items-center justify-end gap-3 border-b border-gray-200 px-4"
      style={{ background: EMR_THEME.white }}
    >
      <button
        type="button"
        className="relative text-gray-500 hover:text-gray-800"
        aria-label="Notifikasi"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 22a2 2 0 002-2H10a2 2 0 002 2zm6-6V11a6 6 0 00-5-5.91V4a1 1 0 00-2 0v1.09A6 6 0 006 11v5l-2 2v1h16v-1l-2-2z" />
        </svg>
        <span
          className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white"
          style={{ background: EMR_THEME.mainBlue }}
        >
          0
        </span>
      </button>
      <EmrUserMenu user={user} onLogout={onLogout} onSwitchApp={onSwitchApp} />
    </header>
  );
}
