import { Montserrat } from "next/font/google";
import type { ReactNode } from "react";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export default function EmrLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${montserrat.className} flex min-h-[100dvh] w-full flex-col overflow-hidden text-gray-800 antialiased`}
    >
      {children}
    </div>
  );
}
