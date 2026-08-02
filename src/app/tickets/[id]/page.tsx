"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  defaultHubPathForUser,
  loadAuthToken,
  loadAuthUser,
  type AuthUser,
} from "@/lib/auth-api";
import { withBasePath } from "@/lib/app-path";
import { AssigneeSearchSelect } from "@/components/AssigneeSearchSelect";
import {
  addTicketComment,
  fetchAssignableUsers,
  fetchTicketDetail,
  patchTicket,
  type AssignableUser,
  type Ticket,
  type TicketChatMessage,
} from "@/lib/tickets-api";
import { TicketChatPanel } from "@/components/TicketChatPanel";
import { TicketInternalCommentsPanel } from "@/components/TicketInternalCommentsPanel";
import type { TicketPriority } from "@/lib/ticket-priority";
import { TicketDescriptionEditor } from "@/components/TicketDescriptionEditor";
import { TicketEditableTitle } from "@/components/TicketEditableTitle";
import { TicketMetaBar } from "@/components/TicketMetaBar";
import { NuhaCareLogo } from "@/components/NuhaCareLogo";
import { NotificationBell } from "@/components/NotificationBell";
import { UserAccountMenu, UserMenuLink } from "@/components/UserAccountMenu";
import { logout } from "@/lib/auth-api";
import {
  nuhaAccentCardClass,
  nuhaBreadcrumbLinkClass,
  nuhaHeaderGhostButtonClass,
  nuhaHubHeaderClass,
  nuhaPageBgClass,
  nuhaPanelBodyClass,
  nuhaPanelClass,
  nuhaPanelHeaderClass,
  nuhaPanelHintClass,
  nuhaPanelTitleClass,
  nuhaSolidButtonClass,
} from "@/lib/nuha-support-theme";

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const isStaff = Boolean(user && user.role !== "user");

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<
    { id: string; body: string; visibility: string; author_name: string; created_at: string }[]
  >([]);
  const [messages, setMessages] = useState<TicketChatMessage[]>([]);
  const [ticketChatOpen, setTicketChatOpen] = useState(false);
  const [chatClosedReason, setChatClosedReason] = useState<
    "ticket" | "session" | "no_session" | null
  >(null);
  const [supportChatStatus, setSupportChatStatus] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([]);
  const [loadingAssignable, setLoadingAssignable] = useState(false);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [savingAssignees, setSavingAssignees] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [urlCopied, setUrlCopied] = useState(false);
  const [commentsExpanded, setCommentsExpanded] = useState(false);

  const load = async () => {
    if (!id) return;
    const data = await fetchTicketDetail(id);
    setTicket(data.ticket);
    setSelectedAssignees((data.ticket.assignees ?? []).map((a) => a.id));
    setComments(data.comments);
    setMessages(data.messages);
    setTicketChatOpen(Boolean(data.ticket_chat_open));
    setChatClosedReason(data.chat_closed_reason ?? null);
    setSupportChatStatus(data.support_chat_status ?? null);
  };

  useEffect(() => {
    if (!loadAuthToken()) {
      router.replace(withBasePath("/login"));
      return;
    }
    setUser(loadAuthUser());
    void load()
      .catch((e) => setError(e instanceof Error ? e.message : "Gagal memuat"))
      .finally(() => setLoading(false));

    if (loadAuthUser()?.role !== "user") {
      setLoadingAssignable(true);
      void fetchAssignableUsers()
        .then((d) => setAssignableUsers(d.users))
        .catch(() => {})
        .finally(() => setLoadingAssignable(false));
    }
  }, [id, router]);

  const onStatusChange = async (status: string) => {
    if (!id) return;
    try {
      await patchTicket(id, { status });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal update");
    }
  };

  const onPriorityChange = async (priority: TicketPriority) => {
    if (!id) return;
    try {
      await patchTicket(id, { priority });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal update prioritas");
    }
  };

  const onTitleSave = async (title: string) => {
    if (!id) return;
    try {
      const { ticket: updated } = await patchTicket(id, { title });
      setTicket((t) => (t ? { ...t, title: updated.title } : t));
      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gagal menyimpan judul";
      setError(msg);
      throw e;
    }
  };

  const onSaveAssignees = async () => {
    if (!id) return;
    setSavingAssignees(true);
    setError(null);
    try {
      await patchTicket(id, { assignee_ids: selectedAssignees });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan assignee");
    } finally {
      setSavingAssignees(false);
    }
  };

  const copyTicketUrl = async () => {
    if (!id || typeof window === "undefined") return;
    const url = `${window.location.origin}${withBasePath(`/tickets/${id}`)}`;
    try {
      await navigator.clipboard.writeText(url);
      setUrlCopied(true);
      window.setTimeout(() => setUrlCopied(false), 2000);
    } catch {
      setError("Gagal menyalin URL tiket");
    }
  };

  const onComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !commentText.trim()) return;
    try {
      await addTicketComment(id, commentText.trim());
      setCommentText("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal komentar");
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-full items-center justify-center bg-[#F5F5F5]">
        <p className="text-sm text-[#717171]">Memuat tiket...</p>
      </main>
    );
  }

  if (!ticket) {
    return (
      <main className="p-8">
        <p>Tiket tidak ditemukan.</p>
        <Link href={withBasePath("/tickets")} className="text-[#07C5BA]">
          Kembali
        </Link>
      </main>
    );
  }

  return (
    <main className={`flex h-[100dvh] flex-col overflow-hidden ${nuhaPageBgClass}`}>
      <header className={nuhaHubHeaderClass}>
        <div className="flex items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <NuhaCareLogo href={defaultHubPathForUser(user)} />
            <nav className="flex min-w-0 items-center gap-1.5 text-xs text-white/70">
              <Link href={withBasePath("/tickets")} className={nuhaBreadcrumbLinkClass}>
                Tiket
              </Link>
              <span aria-hidden className="text-white/40">
                /
              </span>
              <span className="truncate font-medium text-white">
                {ticket.ticket_number}
              </span>
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <NotificationBell />
            <button
              type="button"
              onClick={() => void copyTicketUrl()}
              className={nuhaHeaderGhostButtonClass}
              title="Salin link halaman tiket ini"
            >
              {urlCopied ? "URL tersalin" : "Salin URL"}
            </button>
            <UserAccountMenu
              user={user}
              onLogout={() => {
                logout();
                router.push(withBasePath("/login"));
              }}
            >
              <UserMenuLink href={withBasePath("/tickets")}>Daftar tiket</UserMenuLink>
              {user?.role !== "user" && (
                <UserMenuLink href={withBasePath("/agent")}>Chat implementator</UserMenuLink>
              )}
              {user?.role === "user" && (
                <UserMenuLink href={withBasePath("/support")}>Support chat</UserMenuLink>
              )}
            </UserAccountMenu>
          </div>
        </div>

        <div className="px-4 pb-4 pt-1">
          <TicketEditableTitle
            value={ticket.title}
            editable={isStaff}
            onSave={onTitleSave}
            theme="onDark"
          />
        </div>
      </header>

      <TicketMetaBar
        status={ticket.status}
        priority={ticket.priority}
        hospitalName={ticket.hospital?.name}
        module={ticket.module}
        isStaff={isStaff}
        onStatusChange={isStaff ? (s) => void onStatusChange(s) : undefined}
        onPriorityChange={isStaff ? (p) => void onPriorityChange(p) : undefined}
      />

      {error && (
        <p className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          {error}
        </p>
      )}

      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-4 overflow-hidden p-4">
        <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)] gap-4 lg:grid-cols-2 lg:items-stretch">
          <section className={`${nuhaPanelClass} min-h-[min(45vh,420px)] lg:min-h-0`}>
            <div className={nuhaPanelHeaderClass}>
              <h2 className={nuhaPanelTitleClass}>Detail</h2>
            </div>
            <div className={`${nuhaPanelBodyClass} space-y-4 p-4 text-xs`}>
              <dl className="grid grid-cols-1 gap-3">
                <dt className={nuhaPanelTitleClass}>
                  Assignee
                </dt>
                <dd>
                  {isStaff ? (
                    <div className="space-y-2">
                      <AssigneeSearchSelect
                        users={assignableUsers}
                        value={selectedAssignees}
                        onChange={setSelectedAssignees}
                        disabled={savingAssignees}
                        loading={loadingAssignable}
                      />
                      <button
                        type="button"
                        disabled={savingAssignees}
                        onClick={() => void onSaveAssignees()}
                        className={nuhaSolidButtonClass}
                      >
                        {savingAssignees ? "Menyimpan..." : "Simpan assignee"}
                      </button>
                    </div>
                  ) : (
                    ticket.assignee_names ?? ticket.assignee_name ?? "—"
                  )}
                </dd>
              </dl>
              {ticket.ai_summary && isStaff && (
                <div className={nuhaAccentCardClass}>
                  <h3 className={`mb-1 ${nuhaPanelTitleClass}`}>
                    Ringkasan AI
                  </h3>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#0B1D15]">
                    {ticket.ai_summary}
                  </p>
                </div>
              )}
              {(isStaff || ticket.description) && id && (
                <TicketDescriptionEditor
                  ticketId={id}
                  value={ticket.description ?? ""}
                  editable={isStaff}
                  mentionUsers={assignableUsers}
                  onSaved={(description) =>
                    setTicket((t) => (t ? { ...t, description } : t))
                  }
                  onError={(message) => setError(message)}
                />
              )}
            </div>
          </section>

          <div className="flex min-h-[min(45vh,420px)] flex-col gap-3 overflow-hidden lg:min-h-0">
            <section
              className={`${nuhaPanelClass} min-h-0 ${
                commentsExpanded ? "flex-[2]" : "flex-[3]"
              }`}
            >
              <div className={nuhaPanelHeaderClass}>
                <h2 className={nuhaPanelTitleClass}>Chat tiket</h2>
                <p className={`mt-1 ${nuhaPanelHintClass}`}>
                  Percakapan user RS dengan tim (implementator / support dev). Riwayat AI
                  tetap ditampilkan di atas.
                </p>
              </div>
              <div className="flex min-h-0 flex-1 flex-col p-4 pt-3">
              {!ticket.session_id ? (
                <p className={`text-xs ${nuhaPanelHintClass}`}>Tiket ini tidak memiliki sesi chat terhubung.</p>
              ) : id ? (
                <div className="flex min-h-0 flex-1 flex-col">
                  <TicketChatPanel
                    ticketId={id}
                    messages={messages}
                    chatOpen={ticketChatOpen}
                    chatClosedReason={chatClosedReason}
                    supportChatStatus={supportChatStatus}
                    onSent={() => void load()}
                    onError={(message) => setError(message)}
                  />
                </div>
              ) : null}
              </div>
            </section>

            {isStaff && (
              <TicketInternalCommentsPanel
                className={commentsExpanded ? "flex-[3]" : "flex-[2]"}
                comments={comments}
                commentText={commentText}
                onCommentTextChange={setCommentText}
                onSubmit={onComment}
                expanded={commentsExpanded}
                onToggleExpanded={() => setCommentsExpanded((v) => !v)}
                mentionUsers={assignableUsers}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
