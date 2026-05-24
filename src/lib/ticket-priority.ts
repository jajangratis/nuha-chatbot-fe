export const TICKET_PRIORITIES = ["low", "normal", "high", "urgent"] as const;

export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

const LABELS: Record<TicketPriority, string> = {
  low: "Rendah",
  normal: "Normal",
  high: "Tinggi",
  urgent: "Mendesak",
};

const BADGE_CLASS: Record<TicketPriority, string> = {
  low: "bg-slate-100 text-slate-700 border-slate-300",
  normal: "bg-sky-100 text-sky-800 border-sky-300",
  high: "bg-amber-100 text-amber-900 border-amber-400",
  urgent: "bg-red-600 text-white border-red-700",
};

const SELECT_RING_CLASS: Record<TicketPriority, string> = {
  low: "border-slate-400 focus:ring-slate-300",
  normal: "border-sky-400 focus:ring-sky-300",
  high: "border-amber-500 focus:ring-amber-300",
  urgent: "border-red-600 focus:ring-red-400",
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

export function ticketPrioritySelectClass(value: string | null | undefined): string {
  return SELECT_RING_CLASS[normalizeTicketPriority(value)];
}
