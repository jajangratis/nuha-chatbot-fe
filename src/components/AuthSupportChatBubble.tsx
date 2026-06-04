"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { withBasePath } from "@/lib/app-path";
import {
  AssistantEscalateOffer,
  shouldShowEscalateOffer,
} from "@/components/AssistantEscalateOffer";
import { BetaBadge } from "@/components/BetaBadge";
import { ChatComposer } from "@/components/ChatComposer";
import { ChatMarkdown } from "@/components/ChatMarkdown";
import { ChatReadReceipt } from "@/components/ChatReadReceipt";
import { MessageAttachments } from "@/components/MessageAttachments";
import {
  AUTH_CHANGE_EVENT,
  defaultHubPathForUser,
  loadAuthUser,
  type AuthUser,
} from "@/lib/auth-api";
import { AuthHospitalPickPanel } from "@/components/AuthHospitalPickPanel";
import { staffImplicitNuhaHospital } from "@/lib/chat-hospital-default";
import { loadEmrChatHospitalId, saveEmrChatHospitalId } from "@/lib/emr-flow";
import { resolveStaffNuhaHospitalId } from "@/lib/resolve-staff-nuha-hospital";
import { useChatScrollPin } from "@/lib/chat-scroll";
import { chatPollIntervalMs, usePageVisible } from "@/hooks/use-page-visible";
import {
  createAuthSession,
  escalateAuthSession,
  fetchAuthSessionMessages,
  listAuthSessions,
  sendAuthSessionMessage,
  uploadAuthSessionMessage,
} from "@/lib/support-api-auth";
import type { SupportMessage } from "@/lib/support-api";
import { isSupportChatEnded } from "@/lib/support-session-status";

type UiMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  read_at?: string | null;
  metadata?: unknown;
};

type Props = {
  module?: string;
  /** User dari guard EMR — hindari flash header kosong sebelum loadAuthUser. */
  initialUser?: AuthUser | null;
  /** Tombol eskalasi di atas composer, bukan menempel di balasan AI; bisa diklik sejak awal. */
  standaloneEscalateButton?: boolean;
  /** @deprecated Picker otomatis jika profil belum punya RS. */
  hospitalPickerWhenMissing?: boolean;
  /** Tombol ke dashboard modul sesuai peran (user → /support, agent → /agent, dll.). */
  showStaffDashboardButton?: boolean;
};

function toUiMessage(msg: SupportMessage): UiMessage {
  const role =
    msg.role === "user" ? "user" : msg.role === "system" ? "system" : "assistant";
  return {
    id: msg.id,
    role,
    content: msg.content,
    read_at: msg.read_at,
    metadata: msg.metadata,
  };
}

function isSessionEnded(status: string) {
  return isSupportChatEnded(status);
}

export function AuthSupportChatBubble({
  module = "E-Medical Record V2",
  initialUser = null,
  standaloneEscalateButton = false,
  showStaffDashboardButton = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [storedUser, setStoredUser] = useState<AuthUser | null>(() =>
    initialUser != null ? null : loadAuthUser(),
  );
  const user = initialUser ?? storedUser;
  const [confirmedEmrHospitalId, setConfirmedEmrHospitalId] = useState<string | null>(() => {
    const u = initialUser ?? loadAuthUser();
    return u && staffImplicitNuhaHospital(u.role) ? loadEmrChatHospitalId() : null;
  });
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [sessionStatus, setSessionStatus] = useState("open_ai");
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [staffNuhaLoading, setStaffNuhaLoading] = useState(false);
  const bootstrapRef = useRef(false);
  const staffNuhaResolveRef = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);
  const { onScroll: onChatScroll, forceScrollNext } = useChatScrollPin(
    listRef,
    messages,
  );
  const pageVisible = usePageVisible();

  useEffect(() => {
    const sync = () => {
      const stored = loadAuthUser();
      if (stored) setStoredUser(stored);
    };
    window.addEventListener(AUTH_CHANGE_EVENT, sync);
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, sync);
  }, []);

  const sessionClosed = isSessionEnded(sessionStatus);

  const profileHospitalId = user?.hospital_id ?? user?.hospital?.id ?? null;
  const chatHospitalId = profileHospitalId ?? confirmedEmrHospitalId;
  /** Hanya user RS tanpa RS profil yang wajib pilih; staff dianggap NUHA otomatis. */
  const needsHospitalPick = user?.role === "user" && !profileHospitalId;
  const staffNeedsNuha =
    user != null &&
    staffImplicitNuhaHospital(user.role) &&
    !profileHospitalId &&
    !chatHospitalId;

  const resolveStaffNuha = useCallback(async () => {
    if (!user || !staffImplicitNuhaHospital(user.role) || profileHospitalId) return;

    const cached = loadEmrChatHospitalId();
    if (cached) {
      setConfirmedEmrHospitalId(cached);
      return;
    }

    if (staffNuhaResolveRef.current) return;
    staffNuhaResolveRef.current = true;
    setStaffNuhaLoading(true);
    setError(null);
    try {
      const nuhaId = await resolveStaffNuhaHospitalId();
      saveEmrChatHospitalId(nuhaId);
      setConfirmedEmrHospitalId(nuhaId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat RS NUHA.");
    } finally {
      staffNuhaResolveRef.current = false;
      setStaffNuhaLoading(false);
    }
  }, [user, profileHospitalId]);

  const sessionCreateOptions = useCallback(() => {
    const opts: { module: string; hospital_id?: string } = { module };
    if (!user?.hospital_id && chatHospitalId) {
      opts.hospital_id = chatHospitalId;
    }
    return opts;
  }, [module, user, chatHospitalId]);

  const welcomeMessage = useCallback(
    (displayName: string): UiMessage => ({
      id: "welcome",
      role: "assistant",
      content: `Halo ${displayName}! Ada yang bisa dibantu terkait ${module}?`,
    }),
    [module],
  );

  const refreshSession = useCallback(
    async (sid: string) => {
      const data = await fetchAuthSessionMessages(sid);
      setSessionStatus(data.session.status);
      setQueuePosition(data.session.queue_position ?? null);
      const ui =
        data.messages.length > 0
          ? data.messages.map(toUiMessage)
          : [welcomeMessage(user?.display_name ?? "")];
      setMessages(ui);
      return data;
    },
    [user, welcomeMessage],
  );

  const ensureSession = useCallback(async () => {
    if (sessionId || bootstrapRef.current) return;
    if (!chatHospitalId) return;
    bootstrapRef.current = true;
    await Promise.resolve();
    setBootstrapping(true);
    setError(null);
    try {
      const list = await listAuthSessions();
      const active = list.sessions.find(
        (s) => !isSessionEnded(s.status) && s.module === module,
      );
      if (active) {
        setSessionId(active.id);
        forceScrollNext();
        await refreshSession(active.id);
        return;
      }
      const created = await createAuthSession(sessionCreateOptions());
      setSessionId(created.session.id);
      setSessionStatus(created.session.status);
      setMessages([welcomeMessage(user?.display_name ?? "")]);
      forceScrollNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat chat.");
    } finally {
      bootstrapRef.current = false;
      setBootstrapping(false);
    }
  }, [
    sessionId,
    chatHospitalId,
    module,
    refreshSession,
    forceScrollNext,
    welcomeMessage,
    user,
    sessionCreateOptions,
  ]);

  const toggleChatOpen = () => {
    if (open) {
      setOpen(false);
      return;
    }
    setError(null);
    setOpen(true);
    if (user && staffImplicitNuhaHospital(user.role) && !profileHospitalId) {
      const cached = loadEmrChatHospitalId();
      if (cached) {
        setConfirmedEmrHospitalId(cached);
      } else if (!confirmedEmrHospitalId) {
        void resolveStaffNuha();
      }
    }
  };

  const onHospitalSaved = (updatedUser: AuthUser) => {
    if (!initialUser) setStoredUser(updatedUser);
    setError(null);
    bootstrapRef.current = false;
  };

  useEffect(() => {
    if (!open || needsHospitalPick || !chatHospitalId || sessionId) return;
    void Promise.resolve().then(() => ensureSession());
  }, [open, needsHospitalPick, chatHospitalId, sessionId, ensureSession]);

  useEffect(() => {
    if (!open || !sessionId || sessionClosed || !pageVisible) return;
    const interval = setInterval(() => {
      void refreshSession(sessionId).catch(() => {});
    }, chatPollIntervalMs(sessionStatus));
    return () => clearInterval(interval);
  }, [open, sessionId, sessionClosed, sessionStatus, pageVisible, refreshSession]);

  const onComposerSend = async (text: string, files: File[]) => {
    if (!sessionId || sessionClosed || loading) return;
    setLoading(true);
    setError(null);
    const optimistic: UiMessage = {
      id: `tmp-${Date.now()}`,
      role: "user",
      content: text || (files.length ? "📎 Lampiran" : ""),
    };
    setMessages((prev) => [...prev, optimistic]);
    forceScrollNext();
    try {
      if (files.length > 0) {
        await uploadAuthSessionMessage(sessionId, text, files);
      } else {
        await sendAuthSessionMessage(sessionId, text);
      }
      await refreshSession(sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim pesan.");
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setLoading(false);
    }
  };

  const onEscalate = async () => {
    if (!sessionId || escalating || sessionClosed) return;
    setEscalating(true);
    try {
      const result = await escalateAuthSession(sessionId);
      setSessionStatus(result.session.status);
      setQueuePosition(result.queue_position);
      await refreshSession(sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal eskalasi.");
    } finally {
      setEscalating(false);
    }
  };

  const startNewSession = async () => {
    setSessionId(null);
    setMessages([]);
    setSessionStatus("open_ai");
    setQueuePosition(null);
    bootstrapRef.current = false;
    setBootstrapping(true);
    setError(null);
    try {
      const created = await createAuthSession(sessionCreateOptions());
      setSessionId(created.session.id);
      setSessionStatus(created.session.status);
      setMessages([welcomeMessage(user?.display_name ?? "")]);
      forceScrollNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat sesi baru.");
    } finally {
      setBootstrapping(false);
    }
  };

  const hospitalLabel = user?.hospital?.name ?? user?.hospital?.code;
  const showStandaloneEscalate =
    standaloneEscalateButton &&
    sessionStatus === "open_ai" &&
    !sessionClosed &&
    Boolean(sessionId);

  const headerDashboard =
    showStaffDashboardButton && user
      ? withBasePath(defaultHubPathForUser(user))
      : null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]">
      <div
        className={`pointer-events-auto fixed bottom-5 right-5 flex flex-col items-end gap-3 transition-all duration-300 ${
          open ? "w-[min(100vw-2rem,400px)]" : "w-auto"
        }`}
      >
        {open && (
          <section
            className="flex h-[min(70vh,560px)] w-full flex-col overflow-hidden rounded-2xl border border-[#014547]/10 bg-white shadow-[0_12px_48px_rgba(1,69,71,0.18)]"
            aria-label="Nuha Care Support Beta"
          >
            <header className="flex items-center justify-between bg-gradient-to-r from-[#032626] to-[#0B6463] px-4 py-3 text-white">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">Nuha Care Support</p>
                  <BetaBadge variant="onDark" />
                </div>
                <p className="truncate text-xs text-white/80">
                  {user?.display_name
                    ? hospitalLabel
                      ? `${user.display_name} · ${hospitalLabel}`
                      : user.display_name
                    : hospitalLabel
                      ? `RS: ${hospitalLabel}`
                      : module}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {headerDashboard && (
                  <Link
                    href={headerDashboard}
                    className="rounded-lg border border-white/35 bg-white/10 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-white/20"
                  >
                    Dashboard
                  </Link>
                )}
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

            {needsHospitalPick && user ? (
              <AuthHospitalPickPanel user={user} onSaved={onHospitalSaved} compact />
            ) : staffNeedsNuha ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-[#F5F5F5] p-4 text-center">
                {error ? (
                  <>
                    <p className="text-xs text-amber-900">{error}</p>
                    <button
                      type="button"
                      onClick={() => void resolveStaffNuha()}
                      className="rounded-full border border-[#014547] px-4 py-2 text-xs font-medium text-[#014547]"
                    >
                      Coba lagi
                    </button>
                  </>
                ) : (
                  <p className="text-sm text-[#717171]">
                    {staffNuhaLoading
                      ? "Menyiapkan konteks RS NUHA…"
                      : "Memuat RS NUHA…"}
                  </p>
                )}
              </div>
            ) : bootstrapping && !sessionId ? (
              <p className="flex flex-1 items-center justify-center bg-[#F5F5F5] text-sm text-[#717171]">
                Memuat chat...
              </p>
            ) : (
              <>
                <div
                  ref={listRef}
                  onScroll={onChatScroll}
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
                          {!standaloneEscalateButton &&
                            sessionStatus === "open_ai" &&
                            !sessionClosed &&
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
                          <MessageAttachments
                            metadata={msg.metadata}
                            variant="dark"
                          />
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
                      onClick={() => void startNewSession()}
                      className="mb-2 w-full rounded-lg bg-[#014547] py-2 text-xs text-white"
                    >
                      Mulai sesi baru
                    </button>
                  )}
                  {showStandaloneEscalate && (
                    <button
                      type="button"
                      disabled={escalating || loading}
                      onClick={() => void onEscalate()}
                      className="mb-2 w-full rounded-lg border border-[#014547] bg-[#014547]/5 py-2 text-xs font-medium text-[#014547] transition hover:bg-[#014547]/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {escalating
                        ? "Memasukkan antrian…"
                        : "Hubungi IT Implementator"}
                    </button>
                  )}
                  <ChatComposer
                    value={input}
                    onChange={setInput}
                    onSend={onComposerSend}
                    disabled={sessionClosed || !sessionId}
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
          onClick={toggleChatOpen}
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
