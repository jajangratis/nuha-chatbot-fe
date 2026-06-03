/** Label balasan terakhir user, dibandingkan dengan hari ini (locale id-ID). */
export function formatLastUserReply(iso: string | null | undefined): string {
  if (!iso) return "Belum ada pesan dari user";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMessageDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const dayDiff = Math.round(
    (startOfToday.getTime() - startOfMessageDay.getTime()) / 86_400_000,
  );

  const timeLabel = date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (dayDiff === 0) {
    const minutesAgo = Math.floor((now.getTime() - date.getTime()) / 60_000);
    if (minutesAgo < 1) return "Hari ini · baru saja";
    if (minutesAgo < 60) return `Hari ini · ${minutesAgo} menit lalu`;
    return `Hari ini · ${timeLabel}`;
  }

  if (dayDiff === 1) return `Kemarin · ${timeLabel}`;

  if (dayDiff > 1 && dayDiff < 7) {
    return `${dayDiff} hari lalu · ${timeLabel}`;
  }

  const dateLabel = date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });

  return `${dateLabel} · ${timeLabel}`;
}

/** Kelas warna untuk urgensi (antrian / sesi aktif). */
export function lastUserReplyTone(
  iso: string | null | undefined,
): "muted" | "fresh" | "today" | "stale" {
  if (!iso) return "muted";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "muted";

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMessageDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const dayDiff = Math.round(
    (startOfToday.getTime() - startOfMessageDay.getTime()) / 86_400_000,
  );

  if (dayDiff === 0) {
    const minutesAgo = Math.floor((now.getTime() - date.getTime()) / 60_000);
    if (minutesAgo <= 5) return "fresh";
    return "today";
  }

  return "stale";
}

const TONE_CLASS: Record<ReturnType<typeof lastUserReplyTone>, string> = {
  muted: "text-[#9E9E9E]",
  fresh: "text-[#07C5BA] font-medium",
  today: "text-[#014547]",
  stale: "text-amber-700",
};

export function lastUserReplyClassName(iso: string | null | undefined): string {
  return `text-[10px] leading-tight ${TONE_CLASS[lastUserReplyTone(iso)]}`;
}

const CLOSED_STATUS_LABEL: Record<string, string> = {
  resolved: "Selesai",
  auto_closed: "Ditutup otomatis",
  pending_ticket: "Chat ditutup — dilanjut tiket",
  ticket_open: "Chat ditutup — dilanjut tiket",
};

export function formatSessionClosedStatus(status: string): string {
  return CLOSED_STATUS_LABEL[status] ?? status;
}

/** Kapan sesi ditutup, dibandingkan dengan hari ini. */
export function formatSessionClosedAt(iso: string | null | undefined): string {
  if (!iso) return "Tanggal tutup tidak tersedia";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfCloseDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round(
    (startOfToday.getTime() - startOfCloseDay.getTime()) / 86_400_000,
  );
  const timeLabel = date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (dayDiff === 0) return `Ditutup hari ini · ${timeLabel}`;
  if (dayDiff === 1) return `Ditutup kemarin · ${timeLabel}`;
  if (dayDiff < 7) return `Ditutup ${dayDiff} hari lalu · ${timeLabel}`;

  const dateLabel = date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
  return `Ditutup ${dateLabel} · ${timeLabel}`;
}
