/** Format durasi ms untuk label SLA (id-ID). */
export function formatDurationMs(ms: number | null | undefined): string {
  if (ms == null || ms < 0 || Number.isNaN(ms)) return "—";

  const totalMinutes = Math.floor(ms / 60_000);
  if (totalMinutes < 1) return "< 1 menit";

  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    const parts = [`${days} hari`];
    if (hours > 0) parts.push(`${hours} jam`);
    return parts.join(" ");
  }
  if (hours > 0) {
    const parts = [`${hours} jam`];
    if (minutes > 0) parts.push(`${minutes} menit`);
    return parts.join(" ");
  }
  return `${minutes} menit`;
}

export type SessionSlaMetrics = {
  avg_user_response_ms: number | null;
  avg_agent_response_ms: number | null;
  user_response_samples: number;
  agent_response_samples: number;
  ticket_age_ms: number | null;
  ticket_number: string | null;
  ticket_status: string | null;
};
