/** Chat support hub (tamu, /support, /emr) — terpisah dari status tiket TMS. */

export const SUPPORT_CHAT_ENDED_STATUSES = [
  "resolved",
  "auto_closed",
  "pending_ticket",
  "ticket_open",
] as const;

export function isSupportChatEnded(status: string): boolean {
  return (SUPPORT_CHAT_ENDED_STATUSES as readonly string[]).includes(status);
}
