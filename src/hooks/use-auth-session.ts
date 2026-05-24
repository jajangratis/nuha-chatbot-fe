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
import { useAuthUser } from "@/hooks/use-auth-user";

type AuthSession = {
  /** Client selesai baca / pulihkan localStorage + optional /auth/me */
  ready: boolean;
  token: string | null;
  user: AuthUser | null;
};

/**
 * Bootstrap auth di client: token wajib; user dari localStorage atau GET /auth/me.
 * Redirect ke /login jika tidak ada sesi valid.
 */
export function useAuthSession(): AuthSession {
  const router = useRouter();
  const storedUser = useAuthUser();
  const [session, setSession] = useState<AuthSession>({
    ready: false,
    token: null,
    user: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const token = loadAuthToken();
      if (!token) {
        if (!cancelled) {
          setSession({ ready: true, token: null, user: null });
          router.replace(withBasePath("/login"));
        }
        return;
      }

      let user = loadAuthUser() ?? storedUser;
      if (!user) {
        try {
          const { user: me } = await fetchMe();
          user = me;
          saveAuth(token, user);
        } catch {
          clearAuth();
          if (!cancelled) {
            setSession({ ready: true, token: null, user: null });
            router.replace(withBasePath("/login"));
          }
          return;
        }
      }

      if (!cancelled) {
        setSession({ ready: true, token, user });
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [router, storedUser]);

  return session;
}
