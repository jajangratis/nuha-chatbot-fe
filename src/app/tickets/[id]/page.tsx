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
    setTicketChatOpen(Boolean(data.ticket_chat_open && data.has_session));
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
    <main className="flex h-[100dvh] flex-col overflow-hidden bg-[#F7F8F9]">
      <header className="border-b border-[#E8E8E8] bg-white">
        <div className="flex items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <NuhaCareLogo href={defaultHubPathForUser(user)} variant="onLight" />
            <nav className="flex min-w-0 items-center gap-1.5 text-xs text-[#7C828D]">
              <Link href={withBasePath("/tickets")} className="shrink-0 hover:text-[#7B68EE]">
                Tiket
              </Link>
              <span aria-hidden className="text-[#C4C7CC]">
                /
              </span>
              <span className="truncate font-medium text-[#1E1F21]">
                {ticket.ticket_number}
              </span>
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <NotificationBell theme="onLight" />
            <button
              type="button"
              onClick={() => void copyTicketUrl()}
              className="rounded-md border border-[#E8E8E8] bg-white px-3 py-1.5 text-xs font-medium text-[#1E1F21] hover:bg-[#F7F8F9]"
              title="Salin link halaman tiket ini"
            >
              {urlCopied ? "URL tersalin" : "Salin URL"}
            </button>
            <UserAccountMenu
              theme="onLight"
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
          <section className="flex min-h-[min(45vh,420px)] flex-col overflow-hidden rounded-xl border border-[#E8E8E8] bg-white p-4 shadow-sm lg:min-h-0">
            <h2 className="mb-3 shrink-0 text-xs font-semibold uppercase tracking-wider text-[#7C828D]">
              Detail
            </h2>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-1 text-xs">
              <dl className="grid grid-cols-1 gap-3">
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-[#7C828D]">
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
                        className="rounded bg-[#014547] px-2 py-1 text-[10px] text-white disabled:opacity-50"
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
                <div className="rounded-lg border border-[#F0F1F3] bg-[#FAFBFC] p-3">
                  <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#7C828D]">
                    Ringkasan AI
                  </h3>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#333]">
                    {ticket.ai_summary}
                  </p>
                </div>
              )}
              {(isStaff || ticket.description) && id && (
                <TicketDescriptionEditor
                  ticketId={id}
                  value={ticket.description ?? ""}
                  editable={isStaff}
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
              className={`flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#E8E8E8] bg-white p-4 shadow-sm ${
                commentsExpanded ? "flex-[2]" : "flex-[3]"
              }`}
            >
              <h2 className="mb-1 shrink-0 text-xs font-semibold uppercase tracking-wider text-[#7C828D]">
                Chat tiket
              </h2>
              <p className="mb-2 shrink-0 text-[10px] text-[#717171]">
                Percakapan user RS dengan tim (implementator / support dev). Riwayat AI
                tetap ditampilkan di atas.
              </p>
              {!ticket.session_id ? (
                <p className="text-xs text-[#717171]">Tiket ini tidak memiliki sesi chat terhubung.</p>
              ) : id ? (
                <div className="flex min-h-0 flex-1 flex-col">
                  <TicketChatPanel
                    ticketId={id}
                    messages={messages}
                    chatOpen={ticketChatOpen}
                    onSent={() => void load()}
                    onError={(message) => setError(message)}
                  />
                </div>
              ) : null}
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
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
