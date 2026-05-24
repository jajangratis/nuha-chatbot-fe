"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GuestSupportChat } from "@/components/GuestSupportChat";
import { NuhaSiteEmbed } from "@/components/NuhaSiteEmbed";
import { useAuthSession } from "@/hooks/use-auth-session";
import { withBasePath } from "@/lib/app-path";

/** Beranda publik; pengguna login diarahkan ke modul Support Hub. */
export function HomeEntry() {
  const router = useRouter();
  const { ready, token, user } = useAuthSession({ requireAuth: false });

  useEffect(() => {
    if (!ready || !token || !user) return;

    if (user.role === "user") {
      router.replace(withBasePath("/support"));
      return;
    }
    if (user.role === "agent" || user.role === "admin") {
      router.replace(withBasePath("/agent"));
      return;
    }
    if (user.role === "developer") {
      router.replace(withBasePath("/tickets"));
    }
  }, [ready, token, user, router]);

  if (ready && token && user) {
    return (
      <div className="fixed inset-0 z-0 flex items-center justify-center bg-[#F5F5F5] text-[#014547]">
        <p className="text-sm">Mengalihkan ke Nuha Care Support…</p>
      </div>
    );
  }

  return (
    <>
      <NuhaSiteEmbed />
      <GuestSupportChat />
    </>
  );
}
