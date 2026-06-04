"use client";

import { AuthSupportChatBubble } from "@/components/AuthSupportChatBubble";
import { GuestSupportChat } from "@/components/GuestSupportChat";
import { NuhaLanding } from "@/components/NuhaLanding";
import { useAuthSession } from "@/hooks/use-auth-session";

/** Beranda publik (clone nuha.care); pengguna login tetap di sini, dashboard via tombol di chat. */
export function HomeEntry() {
  const { ready, token, user } = useAuthSession({ requireAuth: false });
  const loggedIn = ready && Boolean(token) && Boolean(user);

  return (
    <>
      <NuhaLanding />
      {loggedIn ? (
        <AuthSupportChatBubble module="Beranda nuha.care" showStaffDashboardButton />
      ) : (
        <GuestSupportChat />
      )}
    </>
  );
}
