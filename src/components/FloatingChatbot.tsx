"use client";

import { FormEvent, useCallback, useRef, useState } from "react";
import { ChatMarkdown } from "@/components/ChatMarkdown";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  meta?: {
    sources?: unknown[];
    retrievalMs?: number;
    finishReason?: string;
  };
};

type ChatApiResponse = {
  answer?: string;
  sources?: unknown[];
  retrievalLatencyMs?: number;
  finishReason?: string;
  error?: string;
};

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function FloatingChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Halo! Saya asisten Nuha Care. Tanyakan apa saja seputar produk Nuha, HRIS, EMR, atau operasional rumah sakit.",
    },
  ]);
  const listRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    });
  }, []);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    scrollToBottom();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      const data = (await res.json()) as ChatApiResponse;

      if (!res.ok) {
        throw new Error(data.error ?? `Permintaan gagal (${res.status})`);
      }

      const assistantMessage: ChatMessage = {
        id: createId(),
        role: "assistant",
        content: data.answer ?? "Maaf, tidak ada jawaban dari server.",
        meta: {
          sources: data.sources,
          retrievalMs: data.retrievalLatencyMs,
          finishReason: data.finishReason,
        },
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Terjadi kesalahan tak terduga.";
      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: "assistant",
          content: `Maaf, gagal menghubungi chatbot: ${message}`,
        },
      ]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  return (
    <div className="chatbot-root pointer-events-none fixed inset-0 z-[9999]">
      <div
        className={`pointer-events-auto fixed bottom-5 right-5 flex flex-col items-end gap-3 transition-all duration-300 ${
          open ? "w-[min(100vw-2rem,400px)]" : "w-auto"
        }`}
      >
        {open && (
          <section
            className="flex h-[min(70vh,560px)] w-full flex-col overflow-hidden rounded-2xl border border-[#014547]/10 bg-white shadow-[0_12px_48px_rgba(1,69,71,0.18)]"
            aria-label="Chat Nuha Care"
          >
            <header className="flex items-center justify-between bg-gradient-to-r from-[#032626] to-[#0B6463] px-4 py-3 text-white">
              <div>
                <p className="text-sm font-semibold">Nuha Care Assistant</p>
                <p className="text-xs text-white/80">Tanya seputar Nuha & HRIS</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-white/90 transition hover:bg-white/15"
                aria-label="Tutup chat"
              >
                <CloseIcon />
              </button>
            </header>

            <div
              ref={listRef}
              className="flex flex-1 flex-col gap-3 overflow-y-auto bg-[#F5F5F5] px-3 py-4"
            >
              {messages.map((msg) => (
                <article
                  key={msg.id}
                  className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "ml-auto max-w-[92%] bg-[#014547] text-white"
                      : "mr-auto w-full max-w-full border border-[#AAE053]/40 bg-white text-[#0B1D15]"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <ChatMarkdown content={msg.content} />
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                  {msg.role === "assistant" && msg.meta && (
                    <div className="mt-2 border-t border-[#F0F0F0] pt-2 text-[10px] text-[#717171]">
                      {typeof msg.meta.retrievalMs === "number" && (
                        <p>Retrieval: {msg.meta.retrievalMs} ms</p>
                      )}
                      {msg.meta.finishReason && (
                        <p>Finish: {msg.meta.finishReason}</p>
                      )}
                      {Array.isArray(msg.meta.sources) &&
                        msg.meta.sources.length > 0 && (
                          <details className="mt-1">
                            <summary className="cursor-pointer text-[#014547]">
                              Sumber ({msg.meta.sources.length})
                            </summary>
                            <pre className="mt-1 max-h-24 overflow-auto rounded bg-[#F5F5F5] p-2 text-[9px]">
                              {JSON.stringify(msg.meta.sources, null, 2)}
                            </pre>
                          </details>
                        )}
                    </div>
                  )}
                </article>
              ))}
              {loading && (
                <p className="mr-auto rounded-2xl bg-white px-3 py-2 text-xs text-[#717171] shadow-sm">
                  Mengetik...
                </p>
              )}
            </div>

            <form
              onSubmit={onSubmit}
              className="flex gap-2 border-t border-[#E8E8E8] bg-white p-3"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ketik pertanyaan Anda..."
                disabled={loading}
                className="min-w-0 flex-1 rounded-full border border-[#E0E0E0] px-4 py-2 text-sm text-[#014547] outline-none transition focus:border-[#07C5BA] focus:ring-2 focus:ring-[#07C5BA]/20 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#639B15] to-[#AAE053] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Kirim pesan"
              >
                <SendIcon />
              </button>
            </form>
          </section>
        )}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[#639B15] to-[#AAE053] text-white shadow-[0_8px_32px_rgba(99,155,21,0.45)] transition hover:scale-105 active:scale-95"
          aria-label={open ? "Tutup chatbot" : "Buka chatbot"}
        >
          {open ? <CloseIcon /> : <ChatIcon />}
        </button>
      </div>
    </div>
  );
}

function ChatIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"
        fill="currentColor"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"
        fill="currentColor"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
        fill="currentColor"
      />
    </svg>
  );
}
