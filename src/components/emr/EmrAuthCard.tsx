import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

/** Kartu login / pilih aplikasi — ditengah layar seperti portal EMR. */
export function EmrAuthCard({ children }: Props) {
  return (
    <div className="flex flex-1 w-full items-center justify-center px-4 py-8">
      <div className="w-11/12 sm:w-9/12 md:w-7/12 lg:w-4/12 xl:w-3/12 max-w-[420px] rounded-lg bg-white pt-2 pb-10 xl:px-6 lg:px-6 md:px-6 px-4 shadow-sm">
        {children}
      </div>
    </div>
  );
}
