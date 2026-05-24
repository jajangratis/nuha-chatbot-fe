"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ChatMarkdown } from "@/components/ChatMarkdown";
import { MessageAttachments } from "@/components/MessageAttachments";
import { formatAssigneeRole } from "@/lib/tickets-api";
import { sendTicketChatMessage, type TicketChatMessage } from "@/lib/tickets-api";

type Props = {
  ticketId: string;
  messages: TicketChatMessage[];
  chatOpen: boolean;
  onSent: () => void;
  onError: (message: string) => void;
};

function messageLabel(m: TicketChatMessage) {
  if (m.role === "user") return "User RS";
  if (m.role === "assistant") return "Asisten AI";
  if (m.role === "system") return "Sistem";
  if (m.role === "agent") {
    const meta = m.metadata as { author_name?: string; staff_role?: string } | null;
    const name = meta?.author_name ?? "Tim support";
    const role = meta?.staff_role ? formatAssigneeRole(meta.staff_role) : "Implementator";
    return `${name} (${role})`;
  }
  return m.role;
}

function bubbleClass(role: string) {
  if (role === "user") return "bg-[#014547]/10";
  if (role === "agent") return "bg-[#E8F7F6] border border-[#07C5BA]/20";
  if (role === "system") return "text-center text-xs italic text-[#717171]";
  return "bg-[#F5F5F5]";
}

export function TicketChatPanel({
  ticketId,
  messages,
  chatOpen,
  onSent,
  onError,
}: Props) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !chatOpen) return;
    setSending(true);
    setSendError(null);
    try {
      await sendTicketChatMessage(ticketId, text.trim());
      setText("");
      onSent();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal mengirim pesan";
      setSendError(msg);
      onError(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain text-sm"
      >
        {messages.map((m) => (
          <div key={m.id} className={`rounded-lg px-2 py-1.5 ${bubbleClass(m.role)}`}>
            <p className="text-[10px] font-medium text-[#717171]">{messageLabel(m)}</p>
            {m.role === "assistant" ? (
              <ChatMarkdown content={m.content} />
            ) : m.role === "system" ? (
              <p className="whitespace-pre-wrap">{m.content}</p>
            ) : (
              <>
                <p className="whitespace-pre-wrap">{m.content}</p>
                <MessageAttachments metadata={m.metadata} />
              </>
            )}
            <p className="mt-1 text-[9px] text-[#999]">
              {new Date(m.created_at).toLocaleString("id-ID")}
            </p>
          </div>
        ))}
        {messages.length === 0 && (
          <p className="text-xs text-[#717171]">Belum ada percakapan.</p>
        )}
      </div>

      {sendError && (
        <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1.5 text-xs text-amber-900">
          {sendError}
        </p>
      )}

      {chatOpen ? (
        <form onSubmit={(e) => void onSubmit(e)} className="mt-3 shrink-0 border-t border-[#E8E8E8] pt-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            placeholder="Kirim pesan ke tiket ini…"
            className="w-full resize-none rounded-lg border border-[#E8E8E8] px-3 py-2 text-sm focus:border-[#07C5BA] focus:outline-none"
          />
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="rounded-lg bg-[#014547] px-4 py-1.5 text-xs text-white disabled:opacity-50"
            >
              {sending ? "Mengirim…" : "Kirim"}
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-3 shrink-0 border-t border-[#E8E8E8] pt-3 text-xs text-[#717171]">
          Chat ditutup karena tiket sudah selesai atau ditutup.
        </p>
      )}
    </div>
  );
}
