import {
  formatTicketPriority,
  ticketPriorityBadgeClass,
} from "@/lib/ticket-priority";

type Props = {
  priority: string | null | undefined;
  className?: string;
};

export function TicketPriorityBadge({ priority, className = "" }: Props) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium leading-tight ${ticketPriorityBadgeClass(priority)} ${className}`}
    >
      {formatTicketPriority(priority)}
    </span>
  );
}
