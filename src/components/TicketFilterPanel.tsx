import type { ReactNode } from "react";

export const filterControlClass =
  "w-full rounded-lg border border-[#E0E0E0] bg-white px-3 py-2 text-sm text-[#0B1D15] shadow-sm outline-none transition placeholder:text-[#9E9E9E] focus:border-[#07C5BA] focus:ring-2 focus:ring-[#07C5BA]/15 disabled:cursor-not-allowed disabled:bg-[#F5F5F5]";

type FilterCardProps = {
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function TicketFilterCard({ children, footer, className = "" }: FilterCardProps) {
  return (
    <section
      className={`rounded-xl border border-[#E8E8E8] bg-white p-4 shadow-sm ${className}`}
    >
      {children}
      {footer ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#F0F0F0] pt-4">
          {footer}
        </div>
      ) : null}
    </section>
  );
}

type FilterFieldProps = {
  label: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

export function TicketFilterField({ label, required, children, className = "" }: FilterFieldProps) {
  return (
    <div className={`min-w-0 ${className}`}>
      <span className="mb-1.5 flex items-center gap-0.5 text-xs font-medium text-[#014547]">
        {label}
        {required ? <span className="text-red-500" aria-hidden>*</span> : null}
      </span>
      {children}
    </div>
  );
}

type ResetButtonProps = {
  onClick: () => void;
  children?: ReactNode;
};

export function TicketFilterResetButton({ onClick, children = "Reset" }: ResetButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg bg-[#E57373] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-[#d66565] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E57373]/50"
    >
      <ResetIcon />
      {children}
    </button>
  );
}

export function TicketFilterHint({ children }: { children: ReactNode }) {
  return <p className="text-xs text-[#717171]">{children}</p>;
}

function ResetIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 12a9 9 0 0115.5-6.5M21 12a9 9 0 01-15.5 6.5M8 7H3V2M16 17h5v5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
