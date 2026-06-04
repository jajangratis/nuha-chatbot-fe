"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AssistantEscalateOffer,
  shouldShowEscalateOffer,
} from "@/components/AssistantEscalateOffer";
import { AuthHospitalPickPanel } from "@/components/AuthHospitalPickPanel";
import { ChatComposer } from "@/components/ChatComposer";
import { ChatMarkdown } from "@/components/ChatMarkdown";
import { SupportHubHeader } from "@/components/SupportHubHeader";
import { UserAccountMenu, UserMenuLink } from "@/components/UserAccountMenu";
import { NotificationBell } from "@/components/NotificationBell";
import { ChatReadReceipt } from "@/components/ChatReadReceipt";
import { MessageAttachments } from "@/components/MessageAttachments";
import { notifyNewChatMessages, supportSessionHref } from "@/lib/notify";
import { useChatScrollPin } from "@/lib/chat-scroll";
import { chatPollIntervalMs, usePageVisible } from "@/hooks/use-page-visible";
import { logout } from "@/lib/auth-api";
import { useAuthSession } from "@/hooks/use-auth-session";
import { withBasePath } from "@/lib/app-path";
import {
  createAuthSession,
  escalateAuthSession,
  fetchAuthSessionMessages,
  listAuthSessions,
  sendAuthSessionMessage,
  uploadAuthSessionMessage,
} from "@/lib/support-api-auth";
import type { SupportMessage, SupportSession } from "@/lib/support-api";
import { isSupportChatEnded } from "@/lib/support-session-status";

type UiMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  read_at?: string | null;
  metadata?: unknown;
};

function toUiMessage(msg: SupportMessage): UiMessage {
  const role =
    msg.role === "user"
      ? "user"
      : msg.role === "system"
        ? "system"
        : "assistant";
  return {
    id: msg.id,
    role,
    content: msg.content,
    read_at: msg.read_at,
    metadata: msg.metadata,
  };
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function isSessionEnded(status: string) {
  return isSupportChatEnded(status);
}

export default function SupportPage() {
  const router = useRouter();
  const { ready: authReady, user } = useAuthSession();
  const [sessions, setSessions] = useState<SupportSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [sessionStatus, setSessionStatus] = useState("open_ai");
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [escalating, setEscalating] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const knownMessageIds = useRef<Set<string>>(new Set());
  const { onScroll: onChatScroll, forceScrollNext } = useChatScrollPin(
    listRef,
    messages,
  );
  const pageVisible = usePageVisible();

  const sessionEnded = isSessionEnded(sessionStatus);

  const applySessionMeta = useCallback((session: SupportSession) => {
    setSessionStatus(session.status);
    setQueuePosition(session.queue_position ?? null);
  }, []);

  const refreshSession = useCallback(
    async (sessionId: string, withNotify = false) => {
      const data = await fetchAuthSessionMessages(sessionId);
      applySessionMeta(data.session);

      const ui =
        data.messages.length > 0
          ? data.messages.map(toUiMessage)
          : [
              {
                id: "welcome",
                role: "assistant" as const,
                content: `Halo ${user?.display_name ?? ""}! Silakan ajukan pertanyaan Anda.`,
              },
            ];

      if (withNotify && data.messages.length > 0) {
        notifyNewChatMessages(
          data.messages.map((m) => ({ id: m.id, role: m.role, content: m.content })),
          knownMessageIds.current,
          {
            myRoles: ["user"],
            peerLabel:
              data.session.status === "active_human"
                ? "Implementator IT"
                : "Nuha Care Support",
            onlyWhenHidden: true,
            href: supportSessionHref(sessionId),
          },
        );
      } else {
        ui.forEach((m) => knownMessageIds.current.add(m.id));
      }

      setMessages(ui);
      return data;
    },
    [applySessionMeta, user?.display_name],
  );

  useEffect(() => {
    if (!authReady) return;
    if (!user) return;
    if (user.role !== "user") {
      router.replace(withBasePath("/login"));
      return;
    }
    setError(null);
    void listAuthSessions().then((data) => setSessions(data.sessions));
  }, [authReady, user, router]);

  useEffect(() => {
    if (!activeSessionId || sessionEnded || !pageVisible) return;

    const interval = setInterval(() => {
      void refreshSession(activeSessionId, true).catch(() => {});
    }, chatPollIntervalMs(sessionStatus));

    return () => clearInterval(interval);
  }, [
    activeSessionId,
    sessionEnded,
    sessionStatus,
    pageVisible,
    refreshSession,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sessionFromUrl = new URLSearchParams(window.location.search).get("session");
    if (!sessionFromUrl) return;
    void loadSession(sessionFromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- buka sesi dari ?session= sekali saat mount
  }, []);

  const loadSession = async (sessionId: string) => {
    setLoading(true);
    setError(null);
    knownMessageIds.current = new Set();
    try {
      setActiveSessionId(sessionId);
      forceScrollNext();
      await refreshSession(sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat sesi.");
    } finally {
      setLoading(false);
    }
  };

  const onNewSession = async () => {
    if (!user?.hospital_id) {
      setError("Pilih rumah sakit Anda terlebih dahulu.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await createAuthSession();
      setActiveSessionId(result.session.id);
      setSessionStatus(result.session.status);
      setQueuePosition(null);
      setSessions((prev) => [result.session, ...prev]);
      const history = await fetchAuthSessionMessages(result.session.id);
      setMessages(
        history.messages.length > 0 ? history.messages.map(toUiMessage) : [],
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat sesi.");
    } finally {
      setLoading(false);
    }
  };

  const onEscalate = async () => {
    if (!activeSessionId || escalating || sessionEnded) return;
    setEscalating(true);
    setError(null);
    try {
      const result = await escalateAuthSession(activeSessionId);
      applySessionMeta(result.session);
      setQueuePosition(result.queue_position);
      forceScrollNext();
      await refreshSession(activeSessionId);
      setSessions((prev) =>
        prev.map((s) => (s.id === result.session.id ? result.session : s)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal eskalasi.");
    } finally {
      setEscalating(false);
    }
  };

  const onSend = async (text: string, files: File[]) => {
    if (!activeSessionId || (!text.trim() && !files.length) || loading || sessionEnded) {
      return;
    }

    const trimmed = text.trim();
    const preview =
      trimmed || `📎 ${files.map((f) => f.name).join(", ")}`;

    setMessages((prev) => [...prev, { id: createId(), role: "user", content: preview }]);
    setInput("");
    setLoading(true);
    forceScrollNext();

    try {
      const result =
        files.length > 0
          ? await uploadAuthSessionMessage(activeSessionId, trimmed, files)
          : await sendAuthSessionMessage(activeSessionId, trimmed);

      setMessages((prev) => {
        const withoutOptimistic = prev.slice(0, -1);
        return [...withoutOptimistic, toUiMessage(result.userMessage)];
      });

      applySessionMeta(result.session);
      if (result.queue_position != null) {
        setQueuePosition(result.queue_position);
      }
      if (result.assistantMessage) {
        setMessages((prev) => [...prev, toUiMessage(result.assistantMessage!)]);
      } else if (result.awaiting_agent) {
        void refreshSession(activeSessionId);
      }
      setSessions((prev) =>
        prev.map((s) => (s.id === result.session.id ? result.session : s)),
      );
    } catch (err) {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          id: createId(),
          role: "assistant",
          content: err instanceof Error ? err.message : "Gagal mengirim pesan.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onLogout = () => {
    logout();
    router.push(withBasePath("/login"));
  };

  if (!authReady || !user) {
    return (
      <main className="flex min-h-full items-center justify-center bg-[#F5F5F5]">
        <p className="text-sm text-[#717171]">Memuat...</p>
      </main>
    );
  }

  const needsHospitalProfile = user.role === "user" && !user.hospital_id;

  if (needsHospitalProfile) {
    return (
      <main className="flex h-dvh flex-col overflow-hidden bg-[#F5F5F5]">
        <SupportHubHeader title="Nuha Care Support" user={user} beta>
          <NotificationBell />
          <UserAccountMenu user={user} onLogout={onLogout}>
            <UserMenuLink href={withBasePath("/tickets")}>Tiket saya</UserMenuLink>
            <UserMenuLink href={withBasePath("/")}>Beranda</UserMenuLink>
          </UserAccountMenu>
        </SupportHubHeader>
        <div className="flex flex-1 items-center justify-center p-4">
          <AuthHospitalPickPanel user={user} onSaved={() => {}} />
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-[#F5F5F5]">
      <SupportHubHeader title="Nuha Care Support" user={user} beta>
        <NotificationBell />
        <UserAccountMenu user={user} onLogout={onLogout}>
          <UserMenuLink href={withBasePath("/tickets")}>Tiket saya</UserMenuLink>
          <UserMenuLink href={withBasePath("/")}>Beranda tamu</UserMenuLink>
        </UserAccountMenu>
      </SupportHubHeader>

      {user.hospital?.name && (
        <p className="border-b border-[#E8E8E8] bg-white px-4 py-1.5 text-xs text-[#717171]">
          RS: <span className="font-medium text-[#014547]">{user.hospital.name}</span>
          {user.hospital.code ? ` (${user.hospital.code})` : ""}
        </p>
      )}

      {error && (
        <p className="bg-amber-50 px-4 py-2 text-sm text-amber-900">{error}</p>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 md:flex-row">
        <aside className="flex w-full shrink-0 flex-col rounded-xl border border-[#E8E8E8] bg-white p-3 md:h-full md:w-56 md:min-h-0">
          <button
            type="button"
            onClick={() => void onNewSession()}
            disabled={loading}
            className="mb-3 w-full rounded-lg bg-[#014547] py-2 text-xs font-medium text-white disabled:opacity-50"
          >
            + Sesi baru
          </button>
          <p className="mb-2 text-xs font-medium text-[#717171]">Sesi sebelumnya</p>
          <ul className="max-h-40 space-y-1 overflow-y-auto text-xs md:min-h-0 md:flex-1 md:max-h-none">
            {sessions.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => void loadSession(s.id)}
                  className={`w-full rounded px-2 py-1.5 text-left ${
                    activeSessionId === s.id
                      ? "bg-[#014547]/10 text-[#014547]"
                      : "hover:bg-[#F5F5F5]"
                  }`}
                >
                  {s.status} · {new Date(s.created_at).toLocaleDateString("id-ID")}
                </button>
              </li>
            ))}
            {sessions.length === 0 && (
              <li className="text-[#717171]">Belum ada sesi</li>
            )}
          </ul>
        </aside>

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#E8E8E8] bg-white">
          {!activeSessionId ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
              <p className="text-sm text-[#717171]">
                Mulai sesi chat baru untuk bertanya ke asisten AI Nuha Care, atau
                hubungi implementator IT jika diperlukan.
              </p>
              <button
                type="button"
                onClick={() => void onNewSession()}
                className="rounded-full bg-gradient-to-r from-[#639B15] to-[#AAE053] px-6 py-2 text-sm font-semibold text-white"
              >
                Mulai chat
              </button>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div
                ref={listRef}
                onScroll={onChatScroll}
                className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain bg-[#F5F5F5] p-4"
              >
                {messages.map((msg) => (
                  <article
                    key={msg.id}
                    className={`rounded-2xl px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "ml-auto max-w-[92%] bg-[#014547] text-white"
                        : msg.role === "system"
                          ? "mx-auto max-w-[95%] border border-[#E8E8E8] bg-[#FFF9E6] text-center text-xs text-[#717171]"
                          : "mr-auto max-w-[92%] border border-[#AAE053]/40 bg-white text-[#0B1D15]"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <>
                        <ChatMarkdown content={msg.content} />
                        <MessageAttachments metadata={msg.metadata} />
                        {sessionStatus === "open_ai" &&
                          !sessionEnded &&
                          shouldShowEscalateOffer(messages, msg.id) && (
                            <AssistantEscalateOffer
                              onEscalate={() => void onEscalate()}
                              escalating={escalating}
                              disabled={loading}
                            />
                          )}
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
                {(loading || escalating) && (
                  <p className="text-xs text-[#717171]">
                    {escalating ? "Memasukkan antrian…" : "Mengetik..."}
                  </p>
                )}
              </div>

              <div className="border-t border-[#E8E8E8] bg-white px-3 pt-2">
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
                {sessionEnded && (
                  <p className="mb-2 text-center text-xs text-[#717171]">
                    Sesi ini telah ditutup. Buat sesi baru untuk melanjutkan.
                  </p>
                )}
              </div>

              {!sessionEnded && (
                <ChatComposer
                  value={input}
                  onChange={setInput}
                  onSend={onSend}
                  disabled={sessionEnded}
                  loading={loading}
                  placeholder={
                    sessionStatus === "open_ai"
                      ? "Ketik pertanyaan..."
                      : "Ketik pesan untuk implementator..."
                  }
                  compact
                />
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
