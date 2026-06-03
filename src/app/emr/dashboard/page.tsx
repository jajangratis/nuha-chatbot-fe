"use client";

import { AuthSupportChatBubble } from "@/components/AuthSupportChatBubble";
import { EmrDashboardCharts } from "@/components/emr/EmrDashboardCharts";
import { EmrDashboardShell } from "@/components/emr/EmrDashboardShell";
import { useEmrAuthGuard } from "@/hooks/use-emr-auth-guard";

export default function EmrDashboardPage() {
  const { ready, user } = useEmrAuthGuard("dashboard");

  if (!ready || !user) {
    return (
      <div
        className="flex min-h-dvh items-center justify-center text-sm text-gray-500"
        style={{ background: "#F4F7FE" }}
      >
        Memuat...
      </div>
    );
  }

  return (
    <>
      <EmrDashboardShell user={user}>
        <EmrDashboardCharts />
      </EmrDashboardShell>
      <AuthSupportChatBubble
        module="E-Medical Record V2"
        initialUser={user}
        standaloneEscalateButton
        hospitalPickerWhenMissing
        showStaffDashboardButton
      />
    </>
  );
}
