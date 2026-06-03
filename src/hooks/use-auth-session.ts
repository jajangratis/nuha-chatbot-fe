"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearAuth,
  fetchMe,
  loadAuthToken,
  loadAuthUser,
  saveAuth,
  type AuthUser,
} from "@/lib/auth-api";
import { withBasePath } from "@/lib/app-path";

export type AuthSession = {
  ready: boolean;
  token: string | null;
  user: AuthUser | null;
};

type Options = {
  /** Jika true (default), tanpa token → redirect /login */
  requireAuth?: boolean;
};

const EMPTY_SESSION: AuthSession = { ready: false, token: null, user: null };

/**
 * Bootstrap auth di client. Jika token ada tapi user hilang, pulihkan via GET /auth/me.
 */
export function useAuthSession(options: Options = {}): AuthSession {
  const { requireAuth = true } = options;
  const router = useRouter();
  const [session, setSession] = useState<AuthSession>(EMPTY_SESSION);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const token = loadAuthToken();
      if (!token) {
        if (!cancelled) {
          setSession({ ready: true, token: null, user: null });
          if (requireAuth) {
            router.replace(withBasePath("/login"));
          }
        }
        return;
      }

      try {
        const me = await fetchMe();
        const user = me.user;
        saveAuth(token, user);
        if (!cancelled) {
          setSession({ ready: true, token, user });
        }
      } catch {
        if (!cancelled) {
          clearAuth();
          setSession({ ready: true, token: null, user: null });
          if (requireAuth) {
            router.replace(withBasePath("/login"));
          }
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [requireAuth, router]);

  return session;
}
