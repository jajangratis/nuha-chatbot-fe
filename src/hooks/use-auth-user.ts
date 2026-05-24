"use client";

import { useSyncExternalStore } from "react";
import { loadAuthUser, type AuthUser } from "@/lib/auth-api";

const AUTH_USER_KEY = "nuha_support_auth_user";
const AUTH_TOKEN_KEY = "nuha_support_auth_token";

function subscribe(onStoreChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === AUTH_USER_KEY || e.key === AUTH_TOKEN_KEY) {
      onStoreChange();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

/** Baca user dari localStorage tanpa hydration mismatch (snapshot server = null). */
export function useAuthUser(): AuthUser | null {
  return useSyncExternalStore(
    subscribe,
    () => loadAuthUser(),
    () => null,
  );
}
