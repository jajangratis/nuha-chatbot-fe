export const TICKET_PRIORITIES = ["low", "normal", "high", "urgent"] as const;

export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

const LABELS: Record<TicketPriority, string> = {
  low: "Rendah",
  normal: "Normal",
  high: "Tinggi",
  urgent: "Mendesak",
};

const BADGE_CLASS: Record<TicketPriority, string> = {
  low: "bg-slate-100 text-slate-700 border-slate-200",
  normal: "bg-sky-50 text-sky-800 border-sky-200",
  high: "bg-amber-50 text-amber-900 border-amber-200",
  urgent: "bg-red-50 text-red-800 border-red-200",
};

/** Map nilai lama `medium` dari DB sebelum migrasi. */
export function normalizeTicketPriority(value: string | null | undefined): TicketPriority {
  const key = (value ?? "normal").toLowerCase();
  if (key === "medium") return "normal";
  if (TICKET_PRIORITIES.includes(key as TicketPriority)) {
    return key as TicketPriority;
  }
  return "normal";
}

export function formatTicketPriority(value: string | null | undefined): string {
  return LABELS[normalizeTicketPriority(value)];
}

export function ticketPriorityBadgeClass(value: string | null | undefined): string {
  return BADGE_CLASS[normalizeTicketPriority(value)];
}
