"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { hasEmrAppSelected } from "@/lib/emr-flow";
import { loadAuthToken, loadAuthUser, type AuthUser } from "@/lib/auth-api";
import { withBasePath } from "@/lib/app-path";

type GuardMode = "login" | "select" | "dashboard";

export function useEmrAuthGuard(mode: GuardMode) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const token = loadAuthToken();
    const authUser = loadAuthUser();

    if (!token || !authUser) {
      if (mode !== "login") {
        router.replace(withBasePath("/emr"));
        return;
      }
      setReady(true);
      return;
    }

    setUser(authUser);

    if (mode === "login") {
      if (hasEmrAppSelected()) {
        router.replace(withBasePath("/emr/dashboard"));
      } else {
        router.replace(withBasePath("/emr/select"));
      }
      return;
    }

    if (mode === "select") {
      setReady(true);
      return;
    }

    if (mode === "dashboard") {
      if (!hasEmrAppSelected()) {
        router.replace(withBasePath("/emr/select"));
        return;
      }
      setReady(true);
    }
  }, [mode, router]);

  return { ready, user };
}
