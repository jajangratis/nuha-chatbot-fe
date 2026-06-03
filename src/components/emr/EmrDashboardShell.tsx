"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { EmrDashboardHeader } from "@/components/emr/EmrDashboardHeader";
import { EmrSidebar } from "@/components/emr/EmrSidebar";
import { withBasePath } from "@/lib/app-path";
import { logout, type AuthUser } from "@/lib/auth-api";
import { clearEmrAppSelection } from "@/lib/emr-flow";
import { EMR_THEME } from "@/components/emr/emr-theme";

type Props = {
  user: AuthUser;
  children: ReactNode;
};

export function EmrDashboardShell({ user, children }: Props) {
  const router = useRouter();

  const handleLogout = () => {
    clearEmrAppSelection();
    logout();
    router.push(withBasePath("/emr"));
  };

  const handleSwitchApp = () => {
    clearEmrAppSelection();
    router.push(withBasePath("/emr/select"));
  };

  return (
    <div
      className="flex h-full min-h-dvh w-full overflow-hidden"
      style={{ background: EMR_THEME.mainBg }}
    >
      <EmrSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <EmrDashboardHeader
          user={user}
          onLogout={handleLogout}
          onSwitchApp={handleSwitchApp}
        />
        <main className="flex-1 overflow-auto p-3">{children}</main>
      </div>
    </div>
  );
}
