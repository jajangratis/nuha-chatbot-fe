"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { withBasePath } from "@/lib/app-path";
import { ChatComposer } from "@/components/ChatComposer";
import { ChatMarkdown } from "@/components/ChatMarkdown";
import { ChatReadReceipt } from "@/components/ChatReadReceipt";
import { MessageAttachments } from "@/components/MessageAttachments";
import { notifyNewChatMessages } from "@/lib/notify";
import {
  clearStoredGuestSession,
  createGuestSession,
  fetchHospitals,
  fetchSession,
  fetchSessionMessages,
  loadStoredGuestSession,
  saveStoredGuestSession,
  sendSessionMessage,
  uploadSessionMessage,
  escalateSession,
  type Hospital,
  type StoredGuestSession,
  type SupportMessage,
} from "@/lib/support-api";

type UiMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  read_at?: string | null;
  metadata?: unknown;
  meta?: {
    sources?: unknown[];
    retrievalMs?: number;
    finishReason?: string;
  };
};

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function toUiMessage(msg: SupportMessage): UiMessage {
  const role =
    msg.role === "user" ? "user" : msg.role === "system" ? "system" : "assistant";
  return {
    id: msg.id,
    role,
    content: msg.content,
    read_at: msg.read_at,
    metadata: msg.metadata,
    meta:
      msg.role === "assistant" && msg.metadata
        ? {
            sources: msg.metadata.sources,
            retrievalMs: msg.metadata.retrievalLatencyMs,
            finishReason: msg.metadata.finishReason,
          }
        : undefined,
  };
}

export function GuestSupportChat() {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<"intake" | "chat">("intake");
  const [stored, setStored] = useState<StoredGuestSession | null>(null);

  const [guestName, setGuestName] = useState("");
  const [hospitalMode, setHospitalMode] = useState<"master" | "custom">("master");
  const [hospitalId, setHospitalId] = useState("");
  const [customHospitalName, setCustomHospitalName] = useState("");
  const [module, setModule] = useState("");
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [hospitalSearch, setHospitalSearch] = useState("");

  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [intakeLoading, setIntakeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hospitalCode, setHospitalCode] = useState<string | null>(null);
  const [idleWarning, setIdleWarning] = useState(false);
  const [idleMinutes, setIdleMinutes] = useState<number | null>(null);
  const [sessionClosed, setSessionClosed] = useState(false);
  const [sessionStatus, setSessionStatus] = useState("open_ai");
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [escalating, setEscalating] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const knownMessageIds = useRef<Set<string>>(new Set());

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    });
  }, []);

  useEffect(() => {
    const saved = loadStoredGuestSession();
    if (saved) {
      setStored(saved);
      setPhase("chat");
      setHospitalCode(saved.hospital?.code ?? null);
      setGuestName(saved.guestName ?? "");
    }
  }, []);

  useEffect(() => {
    if (phase !== "intake" || !open) return;
    void fetchHospitals(hospitalSearch || undefined)
      .then(setHospitals)
      .catch(() => setHospitals([]));
  }, [phase, open, hospitalSearch]);

  const resumeSession = useCallback(async (session: StoredGuestSession) => {
    setLoading(true);
    setError(null);
    try {
      const status = await fetchSession(session.sessionId, session.guestSessionToken);
      if (status.isClosed) {
        setSessionClosed(true);
        clearStoredGuestSession();
        setPhase("intake");
        setStored(null);
        setError("Sesi sebelumnya telah ditutup. Silakan mulai sesi baru.");
        return;
      }

      const data = await fetchSessionMessages(
        session.sessionId,
        session.guestSessionToken,
      );
      setIdleWarning(data.idleWarning);
      setIdleMinutes(data.idleMinutesRemaining);
      setMessages(
        data.messages.length > 0
          ? data.messages.map(toUiMessage)
          : [
              {
                id: "welcome",
                role: "assistant",
                content:
                  "Halo! Saya asisten Nuha Care. Tanyakan seputar produk Nuha, HRIS, EMR, atau operasional rumah sakit.",
              },
            ],
      );
      setSessionStatus(data.session.status);
      setQueuePosition(
        (data.session as { queue_position?: number }).queue_position ?? null,
      );
      setPhase("chat");
    } catch (err) {
      clearStoredGuestSession();
      setStored(null);
      setPhase("intake");
      setError(err instanceof Error ? err.message : "Gagal memuat sesi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (stored && phase === "chat" && messages.length === 0) {
      void resumeSession(stored);
    }
  }, [stored, phase, messages.length, resumeSession]);

  const refreshSession = useCallback(
    async (withNotify = false) => {
      if (!stored) return;
      const [statusData, msgData] = await Promise.all([
        fetchSession(stored.sessionId, stored.guestSessionToken),
        fetchSessionMessages(stored.sessionId, stored.guestSessionToken),
      ]);

      if (statusData.isClosed) {
        setSessionClosed(true);
        clearStoredGuestSession();
        setError("Sesi ditutup karena tidak aktif selama 10 menit.");
        return;
      }

      setSessionStatus(statusData.session.status);
      setQueuePosition(
        (statusData.session as { queue_position?: number }).queue_position ?? null,
      );
      setIdleWarning(statusData.idleWarning);
      setIdleMinutes(statusData.idleMinutesRemaining);

      const ui = msgData.messages.map(toUiMessage);
      if (withNotify) {
        notifyNewChatMessages(
          msgData.messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
          })),
          knownMessageIds.current,
          {
            myRoles: ["user"],
            peerLabel:
              statusData.session.status === "active_human"
                ? "Implementator IT"
                : "Nuha Care Support",
            onlyWhenHidden: !open,
          },
        );
      } else {
        ui.forEach((m) => knownMessageIds.current.add(m.id));
      }

      setMessages(ui);
      scrollToBottom();
    },
    [stored, scrollToBottom, open],
  );

  useEffect(() => {
    if (!stored || phase !== "chat" || sessionClosed) return;

    const interval = setInterval(() => {
      void refreshSession(true).catch(() => {});
    }, 5_000);

    return () => clearInterval(interval);
  }, [stored, phase, sessionClosed, refreshSession]);

  const onStartSession = async (e: FormEvent) => {
    e.preventDefault();
    setIntakeLoading(true);
    setError(null);

    try {
      const body =
        hospitalMode === "master"
          ? {
              guest_name: guestName,
              hospital_id: hospitalId,
              module: module || undefined,
            }
          : {
              guest_name: guestName,
              hospital_custom_name: customHospitalName,
              module: module || undefined,
            };

      const result = await createGuestSession(body);
      const next: StoredGuestSession = {
        sessionId: result.session.id,
        guestSessionToken: result.guest_session_token,
        hospital: result.hospital,
        guestName: guestName.trim(),
      };

      saveStoredGuestSession(next);
      setStored(next);
      setHospitalCode(result.hospital.code);
      setPhase("chat");

      const history = await fetchSessionMessages(
        result.session.id,
        result.guest_session_token,
      );
      const customWelcome =
        result.hospital.source === "guest_custom"
          ? `Kode RS Anda: **${result.hospital.code}**.`
          : null;
      setMessages(
        history.messages.length > 0
          ? history.messages.map(toUiMessage)
          : customWelcome
            ? [
                {
                  id: "welcome",
                  role: "assistant",
                  content: `Halo ${guestName.trim()}! ${customWelcome}`,
                },
              ]
            : [],
      );
      setSessionClosed(false);
      setSessionStatus("open_ai");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memulai sesi.");
    } finally {
      setIntakeLoading(false);
    }
  };

  const onSendMessage = async (text: string, files: File[]) => {
    if (!stored || (!text.trim() && !files.length) || loading || sessionClosed) return;

    const trimmed = text.trim();
    const previewContent =
      trimmed || `📎 ${files.map((f) => f.name).join(", ")}`;

    setMessages((prev) => [
      ...prev,
      { id: createId(), role: "user", content: previewContent },
    ]);
    setInput("");
    setLoading(true);
    scrollToBottom();

    try {
      const result =
        files.length > 0
          ? await uploadSessionMessage(
              stored.sessionId,
              stored.guestSessionToken,
              trimmed,
              files,
            )
          : await sendSessionMessage(
              stored.sessionId,
              stored.guestSessionToken,
              trimmed,
            );

      setIdleWarning(result.idleWarning ?? false);
      setIdleMinutes(result.idleMinutesRemaining ?? null);

      setMessages((prev) => {
        const withoutOptimistic = prev.slice(0, -1);
        return [...withoutOptimistic, toUiMessage(result.userMessage)];
      });

      const assistant = result.assistantMessage;
      if (assistant) {
        setMessages((prev) => [...prev, toUiMessage(assistant)]);
      }
      setSessionStatus(result.session.status);
      setQueuePosition(
        (result.session as { queue_position?: number }).queue_position ?? null,
      );
      if (result.awaiting_agent) {
        void refreshSession();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal mengirim pesan.";
      if (message.includes("ditutup")) {
        setSessionClosed(true);
        clearStoredGuestSession();
      }
      setMessages((prev) => [
        ...prev,
        { id: createId(), role: "assistant", content: message },
      ]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const onComposerSend = (text: string, files: File[]) => {
    void onSendMessage(text, files);
  };

  const onEscalate = async () => {
    if (!stored || escalating) return;
    setEscalating(true);
    setError(null);
    try {
      const result = await escalateSession(
        stored.sessionId,
        stored.guestSessionToken,
      );
      setSessionStatus(result.session.status);
      setQueuePosition(result.queue_position);
      await refreshSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal eskalasi.");
    } finally {
      setEscalating(false);
    }
  };

  const startNewSession = () => {
    knownMessageIds.current = new Set();
    clearStoredGuestSession();
    setStored(null);
    setPhase("intake");
    setMessages([]);
    setSessionClosed(false);
    setError(null);
    setHospitalCode(null);
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
            aria-label="Nuha Care Support"
          >
            <header className="flex items-center justify-between bg-gradient-to-r from-[#032626] to-[#0B6463] px-4 py-3 text-white">
              <div>
                <p className="text-sm font-semibold">Nuha Care Support</p>
                <p className="text-xs text-white/80">
                  {phase === "intake"
                    ? "Isi data untuk memulai"
                    : hospitalCode
                      ? `RS: ${hospitalCode}`
                      : "Chat AI"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Link
                  href={withBasePath("/login")}
                  className="rounded-lg px-2 py-1 text-[10px] text-white/90 hover:bg-white/15"
                >
                  Login
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full p-1 text-white/90 transition hover:bg-white/15"
                  aria-label="Tutup chat"
                >
                  <CloseIcon />
                </button>
              </div>
            </header>

            {error && (
              <p className="bg-amber-50 px-3 py-2 text-xs text-amber-900">{error}</p>
            )}

            {idleWarning && phase === "chat" && !sessionClosed && (
              <p className="bg-amber-50 px-3 py-2 text-xs text-amber-900">
                Sesi akan ditutup otomatis dalam{" "}
                {idleMinutes ?? "beberapa"} menit jika tidak ada pesan baru.
              </p>
            )}

            {phase === "intake" ? (
              <form
                onSubmit={onStartSession}
                className="flex flex-1 flex-col gap-3 overflow-y-auto bg-[#F5F5F5] p-4"
              >
                <label className="text-xs font-medium text-[#014547]">
                  Nama Anda
                  <input
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#E0E0E0] px-3 py-2 text-sm"
                    placeholder="Nama kontak"
                  />
                </label>

                <fieldset className="text-xs text-[#014547]">
                  <legend className="mb-2 font-medium">Rumah sakit</legend>
                  <label className="mr-4 inline-flex items-center gap-1">
                    <input
                      type="radio"
                      checked={hospitalMode === "master"}
                      onChange={() => setHospitalMode("master")}
                    />
                    Dari daftar
                  </label>
                  <label className="inline-flex items-center gap-1">
                    <input
                      type="radio"
                      checked={hospitalMode === "custom"}
                      onChange={() => setHospitalMode("custom")}
                    />
                    RS tidak ada di daftar
                  </label>
                </fieldset>

                {hospitalMode === "master" ? (
                  <>
                    <input
                      type="search"
                      value={hospitalSearch}
                      onChange={(e) => setHospitalSearch(e.target.value)}
                      placeholder="Cari rumah sakit..."
                      className="w-full rounded-lg border border-[#E0E0E0] px-3 py-2 text-sm"
                    />
                    <select
                      required
                      value={hospitalId}
                      onChange={(e) => setHospitalId(e.target.value)}
                      className="w-full rounded-lg border border-[#E0E0E0] px-3 py-2 text-sm"
                    >
                      <option value="">Pilih rumah sakit</option>
                      {hospitals.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name} ({h.code})
                        </option>
                      ))}
                    </select>
                  </>
                ) : (
                  <input
                    required
                    minLength={3}
                    value={customHospitalName}
                    onChange={(e) => setCustomHospitalName(e.target.value)}
                    placeholder="Nama rumah sakit"
                    className="w-full rounded-lg border border-[#E0E0E0] px-3 py-2 text-sm"
                  />
                )}

                <label className="text-xs font-medium text-[#014547]">
                  Modul / topik (opsional)
                  <input
                    value={module}
                    onChange={(e) => setModule(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#E0E0E0] px-3 py-2 text-sm"
                    placeholder="SIMRS, HRIS, ..."
                  />
                </label>

                <button
                  type="submit"
                  disabled={intakeLoading}
                  className="mt-auto rounded-full bg-gradient-to-r from-[#639B15] to-[#AAE053] py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {intakeLoading ? "Memulai..." : "Mulai chat"}
                </button>
              </form>
            ) : (
              <>
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
                          : msg.role === "system"
                            ? "mx-auto max-w-[95%] border border-[#E8E8E8] bg-[#FAFAFA] text-center text-xs text-[#717171]"
                            : "mr-auto w-full max-w-full border border-[#AAE053]/40 bg-white text-[#0B1D15]"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <>
                          <ChatMarkdown content={msg.content} />
                          <MessageAttachments metadata={msg.metadata} />
                        </>
                      ) : msg.role === "system" ? (
                        <p className="whitespace-pre-wrap italic">{msg.content}</p>
                      ) : (
                        <>
                          <div className="flex items-end justify-end gap-1">
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                            <ChatReadReceipt readAt={msg.read_at} variant="dark" />
                          </div>
                          <MessageAttachments metadata={msg.metadata} variant="dark" />
                        </>
                      )}
                    </article>
                  ))}
                  {loading && (
                    <p className="mr-auto rounded-2xl bg-white px-3 py-2 text-xs text-[#717171] shadow-sm">
                      Mengetik...
                    </p>
                  )}
                </div>

                <div className="border-t border-[#E8E8E8] bg-white px-3 py-2">
                  {sessionStatus === "open_ai" && (
                    <button
                      type="button"
                      disabled={escalating || sessionClosed}
                      onClick={() => void onEscalate()}
                      className="mb-2 w-full rounded-lg border border-[#014547] py-1.5 text-xs font-medium text-[#014547] hover:bg-[#014547]/5 disabled:opacity-50"
                    >
                      {escalating
                        ? "Menghubungkan..."
                        : "Hubungi IT Implementator"}
                    </button>
                  )}
                  {["waiting_human", "handover_pending"].includes(sessionStatus) && (
                    <p className="mb-2 text-center text-xs text-[#717171]">
                      Antrian implementator
                      {queuePosition != null ? ` — posisi ${queuePosition}` : ""}
                    </p>
                  )}
                  {sessionStatus === "active_human" && (
                    <p className="mb-2 text-center text-xs text-[#07C5BA]">
                      Terhubung dengan implementator IT
                    </p>
                  )}

                  {sessionClosed && (
                    <button
                      type="button"
                      onClick={startNewSession}
                      className="mb-2 w-full rounded-lg bg-[#014547] py-2 text-xs text-white"
                    >
                      Mulai sesi baru
                    </button>
                  )}

                  <ChatComposer
                    value={input}
                    onChange={setInput}
                    onSend={onComposerSend}
                    disabled={sessionClosed}
                    loading={loading}
                    placeholder="Ketik pertanyaan Anda..."
                    compact
                  />
                </div>
              </>
            )}
          </section>
        )}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[#639B15] to-[#AAE053] text-white shadow-[0_8px_32px_rgba(99,155,21,0.45)] transition hover:scale-105 active:scale-95"
          aria-label={open ? "Tutup support chat" : "Buka support chat"}
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
