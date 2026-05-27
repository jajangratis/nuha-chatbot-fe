"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatComposer } from "@/components/ChatComposer";
import { ChatMarkdown } from "@/components/ChatMarkdown";
import { ChatReadReceipt } from "@/components/ChatReadReceipt";
import { LoggedInHeaderInfo } from "@/components/LoggedInHeaderInfo";
import { NotificationBell } from "@/components/NotificationBell";
import { MessageAttachments } from "@/components/MessageAttachments";
import { SessionLastUserReply } from "@/components/SessionLastUserReply";
import { loadAuthToken, loadAuthUser, logout, type AuthUser } from "@/lib/auth-api";
import { withBasePath } from "@/lib/app-path";
import {
  agentSessionHref,
  notifyNewChatMessages,
  pushNotification,
  ticketHref,
} from "@/lib/notify";
import {
  formatSessionClosedAt,
  formatSessionClosedStatus,
} from "@/lib/last-user-reply";
import {
  claimQueueSession,
  fetchClosedSessions,
  fetchAgentDashboard,
  fetchSessionMessagesAgent,
  handoverSession,
  listHandoverTargets,
  promoteSessionToTicket,
  resolveAgentSession,
  sendAgentHeartbeat,
  sendAgentMessage,
  uploadAgentMessage,
  setAgentReady,
  type AgentDashboard,
} from "@/lib/agent-api";
import type { SupportMessage, SupportSession } from "@/lib/support-api";

type UiMsg = {
  id: string;
  role: "user" | "assistant" | "agent" | "system";
  content: string;
  read_at?: string | null;
  metadata?: unknown;
};

type ActionLoading =
  | "promote"
  | "resolve"
  | "handover-direct"
  | "handover-queue"
  | "handover-load"
  | "claim"
  | "ready"
  | null;

const ACTION_LABELS: Record<Exclude<ActionLoading, null>, string> = {
  promote: "Membuat tiket gangguan…",
  resolve: "Menyelesaikan sesi…",
  "handover-direct": "Serah terima ke rekan…",
  "handover-queue": "Memindahkan ke antrian…",
  "handover-load": "Memuat daftar rekan…",
  claim: "Mengambil kasus…",
  ready: "Menyiapkan status siap…",
};

function toUi(msg: SupportMessage): UiMsg {
  if (msg.role === "user") {
    return {
      id: msg.id,
      role: "user",
      content: msg.content,
      read_at: msg.read_at,
      metadata: msg.metadata,
    };
  }
  if (msg.role === "system") {
    return { id: msg.id, role: "system", content: msg.content, metadata: msg.metadata };
  }
  if (msg.role === "agent") {
    return {
      id: msg.id,
      role: "agent",
      content: msg.content,
      read_at: msg.read_at,
      metadata: msg.metadata,
    };
  }
  return {
    id: msg.id,
    role: "assistant",
    content: msg.content,
    read_at: msg.read_at,
    metadata: msg.metadata,
  };
}

export default function AgentDashboardPage() {
  const router = useRouter();
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [dash, setDash] = useState<AgentDashboard | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<UiMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState<ActionLoading>(null);
  const [error, setError] = useState<string | null>(null);
  const [handoverOpen, setHandoverOpen] = useState(false);
  const [handoverTargets, setHandoverTargets] = useState<
    { user_id: string; display_name: string; status: string }[]
  >([]);
  const [handoverTo, setHandoverTo] = useState("");
  const [sidebarTab, setSidebarTab] = useState<"active" | "history">("active");
  const [closedSessions, setClosedSessions] = useState<SupportSession[]>([]);
  const [loadingClosed, setLoadingClosed] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const knownMessageIds = useRef<Set<string>>(new Set());
  const prevQueueLen = useRef(0);

  const busy = actionLoading !== null || sending;

  const loadClosedSessions = useCallback(async () => {
    setLoadingClosed(true);
    try {
      const { sessions } = await fetchClosedSessions();
      setClosedSessions(sessions);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat riwayat.");
    } finally {
      setLoadingClosed(false);
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    const data = await fetchAgentDashboard();
    const queueLen = data.queue.length;
    if (queueLen > prevQueueLen.current && prevQueueLen.current > 0) {
      pushNotification({
        title: "Antrian baru",
        body: `${queueLen - prevQueueLen.current} kasus menunggu di antrian`,
        type: "info",
        href: withBasePath("/agent"),
      });
    }
    prevQueueLen.current = queueLen;
    setDash(data);
    return data;
  }, []);

  const loadMessages = useCallback(
    async (sessionId: string, options?: { notify?: boolean }) => {
      const data = await fetchSessionMessagesAgent(sessionId);
      const ui = data.messages.map(toUi);

      if (options?.notify) {
        notifyNewChatMessages(ui, knownMessageIds.current, {
          myRoles: ["agent", "assistant"],
          peerLabel: "Pesan dari pengguna",
          onlyWhenHidden: true,
          href: agentSessionHref(sessionId),
        });
      } else {
        ui.forEach((m) => knownMessageIds.current.add(m.id));
      }

      setMessages(ui);
      requestAnimationFrame(() => {
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
      });
    },
    [],
  );

  useEffect(() => {
    const token = loadAuthToken();
    const user = loadAuthUser();
    if (!token || !user) {
      router.replace(withBasePath("/login"));
      return;
    }
    if (!["agent", "developer", "admin"].includes(user.role)) {
      router.replace(withBasePath("/support"));
      return;
    }

    setAuthUser(user);

    void loadDashboard().catch((e) =>
      setError(e instanceof Error ? e.message : "Gagal memuat dashboard."),
    );

    void sendAgentHeartbeat().catch(() => {});

    const hb = setInterval(() => {
      void sendAgentHeartbeat()
        .then((r) => setDash((d) => (d ? { ...d, presence: r.presence } : d)))
        .catch(() => {});
    }, 30_000);

    const poll = setInterval(() => {
      void loadDashboard().catch(() => {});
      if (activeId && sidebarTab === "active") {
        void loadMessages(activeId, { notify: true }).catch(() => {});
      }
    }, 5_000);

    return () => {
      clearInterval(hb);
      clearInterval(poll);
    };
  }, [router, loadDashboard, loadMessages, activeId, sidebarTab]);

  const openSession = useCallback((sessionId: string) => {
    knownMessageIds.current = new Set();
    setActiveId(sessionId);
    setHandoverOpen(false);
    void loadMessages(sessionId);
  }, [loadMessages]);

  const openedFromUrlRef = useRef<string | null>(null);
  useEffect(() => {
    if (!dash || typeof window === "undefined") return;
    const sessionFromUrl = new URLSearchParams(window.location.search).get("session");
    if (!sessionFromUrl || activeId === sessionFromUrl) return;
    if (openedFromUrlRef.current === sessionFromUrl) return;
    openedFromUrlRef.current = sessionFromUrl;
    queueMicrotask(() => openSession(sessionFromUrl));
  }, [dash, activeId, openSession]);

  const switchSidebarTab = (tab: "active" | "history") => {
    setSidebarTab(tab);
    if (tab === "history") {
      void loadClosedSessions();
    }
  };

  const onClaim = async (sessionId: string) => {
    setActionLoading("claim");
    setError(null);
    try {
      await claimQueueSession(sessionId);
      await loadDashboard();
      openSession(sessionId);
      pushNotification({
        title: "Kasus diambil",
        body: "Sesi siap ditangani",
        type: "success",
        href: agentSessionHref(sessionId),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Claim gagal.");
    } finally {
      setActionLoading(null);
    }
  };

  const onReady = async () => {
    setActionLoading("ready");
    setError(null);
    try {
      await setAgentReady();
      await loadDashboard();
      pushNotification({
        title: "Siap terima kasus",
        body: "Anda akan menerima eskalasi dari pengguna",
        type: "success",
        href: withBasePath("/agent"),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal set ready.");
    } finally {
      setActionLoading(null);
    }
  };

  const onSend = async (text: string, files: File[]) => {
    if (!activeId || (!text.trim() && !files.length) || busy) return;
    setSending(true);
    setError(null);
    try {
      if (files.length > 0) {
        await uploadAgentMessage(activeId, text.trim(), files);
      } else {
        await sendAgentMessage(activeId, text.trim());
      }
      setInput("");
      await loadMessages(activeId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal kirim.");
    } finally {
      setSending(false);
    }
  };

  const onPromoteTicket = async () => {
    if (!activeId) return;
    setActionLoading("promote");
    setError(null);
    try {
      const result = await promoteSessionToTicket(activeId);
      pushNotification({
        title: "Tiket dibuat",
        body: result.ticket.ticket_number,
        type: "success",
        href: ticketHref(result.ticket.id),
      });
      await loadDashboard();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal buat tiket.");
    } finally {
      setActionLoading(null);
    }
  };

  const onResolve = async () => {
    if (!activeId) return;
    setActionLoading("resolve");
    setError(null);
    try {
      await resolveAgentSession(activeId);
      setActiveId(null);
      setMessages([]);
      knownMessageIds.current = new Set();
      await loadDashboard();
      pushNotification({
        title: "Sesi selesai",
        body: "Anda siap menerima kasus berikutnya",
        type: "success",
        href: withBasePath("/agent"),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyelesaikan sesi.");
    } finally {
      setActionLoading(null);
    }
  };

  const openHandover = async () => {
    setActionLoading("handover-load");
    setError(null);
    try {
      const { agents } = await listHandoverTargets();
      setHandoverTargets(agents);
      setHandoverOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat rekan.");
    } finally {
      setActionLoading(null);
    }
  };

  const onHandoverDirect = async () => {
    if (!activeId || !handoverTo) return;
    setActionLoading("handover-direct");
    setError(null);
    try {
      await handoverSession(activeId, { mode: "direct", to_agent_id: handoverTo });
      setHandoverOpen(false);
      setActiveId(null);
      setMessages([]);
      knownMessageIds.current = new Set();
      await loadDashboard();
      pushNotification({
        title: "Serah terima berhasil",
        body: "Sesi dialihkan ke rekan",
        type: "success",
        href: withBasePath("/agent"),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Handover gagal.");
    } finally {
      setActionLoading(null);
    }
  };

  const onHandoverQueue = async () => {
    if (!activeId) return;
    setActionLoading("handover-queue");
    setError(null);
    try {
      await handoverSession(activeId, { mode: "queue" });
      setHandoverOpen(false);
      setActiveId(null);
      setMessages([]);
      knownMessageIds.current = new Set();
      await loadDashboard();
      pushNotification({
        title: "Dikembalikan ke antrian",
        type: "success",
        href: withBasePath("/agent"),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Handover gagal.");
    } finally {
      setActionLoading(null);
    }
  };

  const sessionLabel = (s: SupportSession) =>
    `${s.guest_name || "User"} · ${s.hospital?.code || "-"} · ${s.status}`;

  const activeSession =
    dash?.active_sessions.find((s) => s.id === activeId) ??
    dash?.queue.find((s) => s.id === activeId) ??
    closedSessions.find((s) => s.id === activeId) ??
    null;

  const readOnly =
    activeSession != null &&
    (activeSession.status === "resolved" || activeSession.status === "auto_closed");

  return (
    <main className="flex min-h-full flex-col bg-[#F5F5F5]">
      <header className="flex items-center justify-between bg-gradient-to-r from-[#032626] to-[#0B6463] px-4 py-3 text-white">
        <div>
          {authUser ? (
            <LoggedInHeaderInfo
              user={authUser}
              title="Dashboard Implementator"
              subtitle={`Status: ${dash?.presence.status ?? "…"} · Sesi aktif: ${dash?.presence.active_sessions ?? 0}`}
            />
          ) : (
            <p className="text-sm font-semibold">Dashboard Implementator</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button
            type="button"
            onClick={() => void onReady()}
            disabled={busy}
            className="rounded-lg bg-white/15 px-3 py-1 text-xs hover:bg-white/25 disabled:opacity-50"
          >
            {actionLoading === "ready" ? "Menyiapkan…" : "Siap terima kasus"}
          </button>
          <Link href={withBasePath("/tickets")} className="rounded-lg px-2 py-1 text-xs hover:bg-white/10">
            Tiket
          </Link>
          <Link href={withBasePath("/")} className="rounded-lg px-2 py-1 text-xs hover:bg-white/10">
            Home
          </Link>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push(withBasePath("/login"));
            }}
            className="rounded-lg px-2 py-1 text-xs hover:bg-white/10"
          >
            Keluar
          </button>
        </div>
      </header>

      {error && (
        <p className="bg-amber-50 px-4 py-2 text-sm text-amber-900">{error}</p>
      )}

      <div className="flex flex-1 flex-col gap-4 p-4 lg:flex-row">
        <aside className="w-full shrink-0 space-y-4 lg:w-72">
          <div className="flex rounded-lg border border-[#E8E8E8] bg-white p-0.5 text-xs">
            <button
              type="button"
              onClick={() => switchSidebarTab("active")}
              className={`flex-1 rounded-md py-1.5 font-medium ${
                sidebarTab === "active"
                  ? "bg-[#014547] text-white"
                  : "text-[#717171] hover:bg-[#F5F5F5]"
              }`}
            >
              Aktif
            </button>
            <button
              type="button"
              onClick={() => switchSidebarTab("history")}
              className={`flex-1 rounded-md py-1.5 font-medium ${
                sidebarTab === "history"
                  ? "bg-[#014547] text-white"
                  : "text-[#717171] hover:bg-[#F5F5F5]"
              }`}
            >
              Riwayat
            </button>
          </div>

          {sidebarTab === "active" ? (
            <>
          <section className="rounded-xl border border-[#E8E8E8] bg-white p-3">
            <h2 className="mb-2 text-xs font-semibold text-[#014547]">
              Antrian ({dash?.queue.length ?? 0})
            </h2>
            <ul className="max-h-40 space-y-1 overflow-y-auto text-xs">
              {(dash?.queue ?? []).map((s) => (
                <li
                  key={s.id}
                  className="flex items-start justify-between gap-2 rounded border border-[#F0F0F0] p-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{sessionLabel(s)}</p>
                    <SessionLastUserReply at={s.last_user_message_at} />
                  </div>
                  <button
                    type="button"
                    onClick={() => void onClaim(s.id)}
                    disabled={busy}
                    className="mt-0.5 shrink-0 rounded bg-[#014547] px-2 py-0.5 text-white disabled:opacity-50"
                  >
                    {actionLoading === "claim" ? "…" : "Claim"}
                  </button>
                </li>
              ))}
              {!dash?.queue.length && (
                <li className="text-[#717171]">Antrian kosong</li>
              )}
            </ul>
          </section>

          <section className="rounded-xl border border-[#E8E8E8] bg-white p-3">
            <h2 className="mb-2 text-xs font-semibold text-[#014547]">Sesi aktif</h2>
            <ul className="space-y-1 text-xs">
              {(dash?.active_sessions ?? []).map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => openSession(s.id)}
                    className={`w-full rounded p-2 text-left ${
                      activeId === s.id ? "bg-[#014547]/10 text-[#014547]" : "hover:bg-[#F5F5F5]"
                    }`}
                  >
                    <p className="font-medium">{sessionLabel(s)}</p>
                    <SessionLastUserReply at={s.last_user_message_at} />
                  </button>
                </li>
              ))}
              {!dash?.active_sessions.length && (
                <li className="text-[#717171]">Tidak ada sesi aktif</li>
              )}
            </ul>
          </section>
            </>
          ) : (
            <section className="rounded-xl border border-[#E8E8E8] bg-white p-3">
              <h2 className="mb-2 text-xs font-semibold text-[#014547]">
                Chat selesai / ditutup ({closedSessions.length})
              </h2>
              <p className="mb-2 text-[10px] text-[#717171]">
                {authUser?.role === "agent"
                  ? "Sesi yang pernah Anda tangani. Mode baca saja."
                  : "Semua chat selesai atau ditutup. Mode baca saja."}
              </p>
              {loadingClosed ? (
                <p className="text-xs text-[#717171]">Memuat riwayat…</p>
              ) : (
                <ul className="max-h-[60vh] space-y-1 overflow-y-auto text-xs">
                  {closedSessions.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSidebarTab("history");
                          openSession(s.id);
                        }}
                        className={`w-full rounded border p-2 text-left ${
                          activeId === s.id
                            ? "border-[#014547]/30 bg-[#014547]/10 text-[#014547]"
                            : "border-[#F0F0F0] hover:bg-[#F5F5F5]"
                        }`}
                      >
                        <p className="font-medium">
                          {s.guest_name || "User"} · {s.hospital?.code || "-"}
                        </p>
                        <p className="text-[10px] font-medium text-[#014547]">
                          {formatSessionClosedStatus(s.status)}
                        </p>
                        <p className="text-[10px] text-[#717171]">
                          {formatSessionClosedAt(s.closed_at ?? s.updated_at)}
                        </p>
                        <SessionLastUserReply at={s.last_user_message_at} />
                      </button>
                    </li>
                  ))}
                  {closedSessions.length === 0 && (
                    <li className="text-[#717171]">Belum ada riwayat chat</li>
                  )}
                </ul>
              )}
            </section>
          )}
        </aside>

        <section className="relative flex min-h-[420px] flex-1 flex-col rounded-xl border border-[#E8E8E8] bg-white">
          {actionLoading && (
            <div
              className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-xl bg-white/80 backdrop-blur-[1px]"
              role="status"
              aria-live="polite"
            >
              <span className="h-9 w-9 animate-spin rounded-full border-2 border-[#014547] border-t-transparent" />
              <p className="text-sm font-medium text-[#014547]">
                {ACTION_LABELS[actionLoading]}
              </p>
            </div>
          )}

          {!activeId ? (
            <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-[#717171]">
              {sidebarTab === "history"
                ? "Pilih chat dari riwayat untuk dibaca"
                : "Pilih sesi aktif atau claim dari antrian"}
            </div>
          ) : (
            <>
              {readOnly && (
                <div className="border-b border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  Mode baca — sesi{" "}
                  <strong>{formatSessionClosedStatus(activeSession!.status)}</strong>
                  {activeSession?.closed_at
                    ? ` · ${formatSessionClosedAt(activeSession.closed_at)}`
                    : null}
                </div>
              )}
              {activeSession && !readOnly && (
                <div className="border-b border-[#E8E8E8] bg-[#FAFAFA] px-3 py-2">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-[#717171]">
                    Balasan terakhir user
                  </p>
                  <SessionLastUserReply at={activeSession.last_user_message_at} />
                </div>
              )}
              {!readOnly && (
                <>
                  <div className="flex flex-wrap gap-2 border-b border-[#E8E8E8] p-2">
                    <button
                      type="button"
                      onClick={() => void onPromoteTicket()}
                      disabled={busy}
                      className="rounded-lg border border-amber-400 bg-amber-50 px-3 py-1 text-xs text-amber-900 disabled:opacity-50"
                    >
                      {actionLoading === "promote" ? "Membuat tiket…" : "Buat tiket gangguan"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void onResolve()}
                      disabled={busy}
                      className="rounded-lg bg-[#639B15] px-3 py-1 text-xs text-white disabled:opacity-50"
                    >
                      {actionLoading === "resolve" ? "Menyelesaikan…" : "Selesai & siap bantu lagi"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void openHandover()}
                      disabled={busy}
                      className="rounded-lg border border-[#014547] px-3 py-1 text-xs text-[#014547] disabled:opacity-50"
                    >
                      {actionLoading === "handover-load"
                        ? "Memuat…"
                        : "Serah terima shift"}
                    </button>
                  </div>

                  {handoverOpen && (
                    <div className="border-b border-[#E8E8E8] bg-[#FAFAFA] p-3 text-xs">
                      <p className="mb-2 font-medium text-[#014547]">Serah terima</p>
                      <select
                        value={handoverTo}
                        onChange={(e) => setHandoverTo(e.target.value)}
                        disabled={busy}
                        className="mb-2 w-full rounded border px-2 py-1 disabled:opacity-50"
                      >
                        <option value="">Pilih rekan (direct)</option>
                        {handoverTargets.map((a) => (
                          <option key={a.user_id} value={a.user_id}>
                            {a.display_name} ({a.status})
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void onHandoverDirect()}
                          disabled={!handoverTo || busy}
                          className="rounded bg-[#014547] px-2 py-1 text-white disabled:opacity-50"
                        >
                          {actionLoading === "handover-direct" ? "…" : "Ke rekan"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void onHandoverQueue()}
                          disabled={busy}
                          className="rounded border border-[#014547] px-2 py-1 text-[#014547] disabled:opacity-50"
                        >
                          {actionLoading === "handover-queue" ? "…" : "Ke antrian"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setHandoverOpen(false)}
                          disabled={busy}
                          className="text-[#717171] disabled:opacity-50"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div
                ref={listRef}
                className="flex flex-1 flex-col gap-2 overflow-y-auto bg-[#F5F5F5] p-3"
              >
                {messages.map((m) => {
                  const isMine = m.role === "agent";
                  const isUser = m.role === "user";
                  return (
                    <article
                      key={m.id}
                      className={`rounded-xl px-3 py-2 text-sm ${
                        isUser
                          ? "mr-auto max-w-[85%] border border-[#E8E8E8] bg-white text-[#0B1D15]"
                          : m.role === "system"
                            ? "mx-auto text-center text-xs italic text-[#717171]"
                            : isMine
                              ? "ml-auto max-w-[85%] border border-[#AAE053]/50 bg-[#E8F5E3] text-[#0B1D15]"
                              : "mr-auto max-w-[90%] border border-[#AAE053]/40 bg-white text-[#0B1D15]"
                      }`}
                    >
                      <div className="flex items-end justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          {m.role === "assistant" || m.role === "agent" ? (
                            <>
                              <ChatMarkdown content={m.content} />
                              <MessageAttachments metadata={m.metadata} />
                            </>
                          ) : (
                            <>
                              <p className="whitespace-pre-wrap">{m.content}</p>
                              <MessageAttachments metadata={m.metadata} />
                            </>
                          )}
                        </div>
                        {isMine && <ChatReadReceipt readAt={m.read_at} variant="light" />}
                      </div>
                    </article>
                  );
                })}
                {sending && (
                  <p className="text-center text-xs text-[#717171]">Mengirim…</p>
                )}
              </div>

              {!readOnly ? (
                <ChatComposer
                  value={input}
                  onChange={setInput}
                  onSend={onSend}
                  disabled={busy}
                  loading={sending}
                  placeholder="Balas pengguna..."
                  compact
                  className="border-t border-[#E8E8E8] p-3"
                />
              ) : (
                <p className="border-t border-[#E8E8E8] p-3 text-center text-xs text-[#717171]">
                  Percakapan ditutup — tidak dapat membalas
                </p>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
