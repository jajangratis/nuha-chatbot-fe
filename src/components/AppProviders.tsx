"use client";

import { useEffect } from "react";
import { NotificationToasts } from "@/components/NotificationToasts";
import { requestNotificationPermission } from "@/lib/notify";

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void requestNotificationPermission();
  }, []);

  return (
    <>
      {children}
      <NotificationToasts />
    </>
  );
}
