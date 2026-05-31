import {
  formatTicketPriority,
  ticketPriorityBadgeClass,
  ticketPriorityDotClass,
} from "@/lib/ticket-priority";

type Props = {
  priority: string | null | undefined;
  className?: string;
  /** `dot` — indikator warna saja (mis. di samping dropdown) */
  variant?: "badge" | "dot";
};

export function TicketPriorityBadge({
  priority,
  className = "",
  variant = "badge",
}: Props) {
  if (variant === "dot") {
    return (
      <span
        className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${ticketPriorityDotClass(priority)} ${className}`}
        title={formatTicketPriority(priority)}
        aria-label={formatTicketPriority(priority)}
      />
    );
  }

  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-tight ${ticketPriorityBadgeClass(priority)} ${className}`}
    >
      {formatTicketPriority(priority)}
    </span>
  );
}
