import type { ReactNode } from "react";
import { LoggedInHeaderInfo } from "@/components/LoggedInHeaderInfo";
import { NuhaCareLogo } from "@/components/NuhaCareLogo";
import { defaultHubPathForUser, type AuthUser } from "@/lib/auth-api";

type Props = {
  title: string;
  subtitle?: string;
  logoHref?: string;
  user?: AuthUser | null;
  beta?: boolean;
  children: ReactNode;
};

export function SupportHubHeader({
  title,
  subtitle,
  logoHref,
  user,
  beta,
  children,
}: Props) {
  return (
    <header className="flex items-center justify-between gap-3 bg-gradient-to-r from-[#032626] to-[#0B6463] px-4 py-3 text-white">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <NuhaCareLogo href={logoHref ?? defaultHubPathForUser(user)} />
        <LoggedInHeaderInfo title={title} subtitle={subtitle} beta={beta} />
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </header>
  );
}
