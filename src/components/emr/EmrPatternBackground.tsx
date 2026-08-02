import type { ReactNode } from "react";
import { withBasePath } from "@/lib/app-path";

type Props = {
  children: ReactNode;
  className?: string;
};

/** Latar login EMR — asset lokal (`public/emr/bg.svg`), tanpa host internal/VPN. */
export function EmrPatternBackground({ children, className = "" }: Props) {
  const bgUrl = withBasePath("/emr/bg.svg");

  return (
    <div
      className={`flex min-h-dvh w-full flex-col overflow-x-hidden bg-cover bg-center bg-no-repeat ${className}`}
      style={{ backgroundImage: `url('${bgUrl}')` }}
    >
      {children}
    </div>
  );
}
