/** Warna header grup status (list / board) — selaras palet Nuha Care */
export type TicketStatusTheme = {
  label: string;
  /** Border kiri section */
  sectionAccent: string;
  /** Kelas header bar */
  header: string;
  /** Badge jumlah tiket */
  count: string;
};

export const TICKET_STATUS_THEME: Record<string, TicketStatusTheme> = {
  new: {
    label: "Baru",
    sectionAccent: "border-l-sky-500",
    header: "border-b border-sky-100 bg-sky-50 text-sky-900",
    count: "bg-sky-100 text-sky-800",
  },
  assigned: {
    label: "Ditugaskan",
    sectionAccent: "border-l-violet-500",
    header: "border-b border-violet-100 bg-violet-50 text-violet-900",
    count: "bg-violet-100 text-violet-800",
  },
  in_progress: {
    label: "Dikerjakan",
    sectionAccent: "border-l-amber-500",
    header: "border-b border-amber-100 bg-amber-50 text-amber-950",
    count: "bg-amber-100 text-amber-900",
  },
  waiting_user: {
    label: "Menunggu user",
    sectionAccent: "border-l-orange-400",
    header: "border-b border-orange-100 bg-orange-50 text-orange-950",
    count: "bg-orange-100 text-orange-900",
  },
  resolved: {
    label: "Selesai",
    sectionAccent: "border-l-[#639B15]",
    header: "border-b border-[#CFEE9D] bg-[#F6FBEF] text-[#2d5016]",
    count: "bg-[#E8F5D6] text-[#3d6b1a]",
  },
  closed: {
    label: "Ditutup",
    sectionAccent: "border-l-slate-400",
    header: "border-b border-slate-200 bg-slate-50 text-slate-800",
    count: "bg-slate-200 text-slate-700",
  },
  rejected: {
    label: "Ditolak",
    sectionAccent: "border-l-red-500",
    header: "border-b border-red-100 bg-red-50 text-red-900",
    count: "bg-red-100 text-red-800",
  },
  duplicate: {
    label: "Duplikat",
    sectionAccent: "border-l-fuchsia-400",
    header: "border-b border-fuchsia-100 bg-fuchsia-50 text-fuchsia-900",
    count: "bg-fuchsia-100 text-fuchsia-800",
  },
};

export const TICKET_STATUS_ORDER = [
  "new",
  "assigned",
  "in_progress",
  "waiting_user",
  "resolved",
  "closed",
  "rejected",
  "duplicate",
] as const;

const FALLBACK_THEME: TicketStatusTheme = {
  label: "Lainnya",
  sectionAccent: "border-l-[#07C5BA]",
  header: "border-b border-[#E0F7F5] bg-[#E8F9F8] text-[#014547]",
  count: "bg-[#CCF0EC] text-[#014547]",
};

/** Grup status tidak dikenal / legacy */
export const TICKET_STATUS_OTHER_THEME: TicketStatusTheme = {
  ...FALLBACK_THEME,
  label: "Lainnya",
};

export function isKnownTicketStatus(status: string): boolean {
  return status in TICKET_STATUS_THEME;
}

export function getTicketStatusTheme(status: string): TicketStatusTheme {
  return TICKET_STATUS_THEME[status] ?? { ...FALLBACK_THEME, label: status };
}

export function ticketStatusLabel(status: string): string {
  return TICKET_STATUS_THEME[status]?.label ?? status;
}
