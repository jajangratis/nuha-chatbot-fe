"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChatMarkdown } from "@/components/ChatMarkdown";
import { loadAuthToken, loadAuthUser, type AuthUser } from "@/lib/auth-api";
import { withBasePath } from "@/lib/app-path";
import { AssigneeSearchSelect } from "@/components/AssigneeSearchSelect";
import {
  addTicketComment,
  fetchAssignableUsers,
  fetchTicketDetail,
  patchTicket,
  type AssignableUser,
  type Ticket,
} from "@/lib/tickets-api";
import {
  formatTicketPriority,
  TICKET_PRIORITIES,
  ticketPrioritySelectClass,
  type TicketPriority,
} from "@/lib/ticket-priority";
import { TicketPriorityBadge } from "@/components/TicketPriorityBadge";
import { TicketDescriptionEditor } from "@/components/TicketDescriptionEditor";

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const isStaff = Boolean(user && user.role !== "user");

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<
    { id: string; body: string; visibility: string; author_name: string; created_at: string }[]
  >([]);
  const [messages, setMessages] = useState<
    { id: string; role: string; content: string; created_at: string }[]
  >([]);
  const [commentText, setCommentText] = useState("");
  const [commentVis, setCommentVis] = useState<"internal" | "public">("internal");
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([]);
  const [loadingAssignable, setLoadingAssignable] = useState(false);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [savingAssignees, setSavingAssignees] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [urlCopied, setUrlCopied] = useState(false);

  const load = async () => {
    if (!id) return;
    const data = await fetchTicketDetail(id);
    setTicket(data.ticket);
    setSelectedAssignees((data.ticket.assignees ?? []).map((a) => a.id));
    setComments(data.comments);
    setMessages(data.messages);
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
      await addTicketComment(id, commentText.trim(), commentVis);
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
    <main className="min-h-full bg-[#F5F5F5]">
      <header className="bg-gradient-to-r from-[#032626] to-[#0B6463] px-4 py-3 text-white">
        <Link href={withBasePath("/tickets")} className="text-xs text-white/80 hover:underline">
          ← Daftar tiket
        </Link>
        {user && (
          <p className="mt-2 text-xs text-white/80">
            Login sebagai{" "}
            <span className="font-medium text-white">{user.display_name}</span>
          </p>
        )}
        <div className="mt-1 flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold">{ticket.ticket_number}</h1>
            <p className="text-sm text-white/90">{ticket.title}</p>
          </div>
          <button
            type="button"
            onClick={() => void copyTicketUrl()}
            className="shrink-0 rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20"
            title="Salin link halaman tiket ini"
          >
            {urlCopied ? "URL tersalin" : "Salin URL"}
          </button>
        </div>
      </header>

      {error && (
        <p className="bg-amber-50 px-4 py-2 text-sm text-amber-900">{error}</p>
      )}

      <div className="mx-auto grid max-w-6xl gap-4 p-4 lg:grid-cols-2 lg:items-stretch">
        <section className="flex h-full min-h-0 flex-col gap-4 rounded-xl border border-[#E8E8E8] bg-white p-4">
          <h2 className="shrink-0 text-sm font-semibold text-[#014547]">Detail</h2>
          <dl className="grid grid-cols-2 gap-2 text-xs">
            <dt className="text-[#717171]">Status</dt>
            <dd>
              {isStaff ? (
                <select
                  value={ticket.status}
                  onChange={(e) => void onStatusChange(e.target.value)}
                  className="rounded border px-1 py-0.5"
                >
                  {[
                    "new",
                    "assigned",
                    "in_progress",
                    "waiting_user",
                    "resolved",
                    "closed",
                    "rejected",
                    "duplicate",
                  ].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              ) : (
                ticket.status
              )}
            </dd>
            <dt className="text-[#717171]">RS</dt>
            <dd>{ticket.hospital?.name ?? "—"}</dd>
            <dt className="text-[#717171]">Prioritas</dt>
            <dd>
              {isStaff ? (
                <div className="flex flex-wrap items-center gap-2">
                  <TicketPriorityBadge priority={ticket.priority} />
                  <select
                    value={ticket.priority}
                    onChange={(e) =>
                      void onPriorityChange(e.target.value as TicketPriority)
                    }
                    className={`rounded border-2 bg-white px-1.5 py-0.5 text-xs focus:outline-none focus:ring-2 ${ticketPrioritySelectClass(ticket.priority)}`}
                  >
                    {TICKET_PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {formatTicketPriority(p)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <TicketPriorityBadge priority={ticket.priority} />
              )}
            </dd>
            <dt className="text-[#717171]">Assignee</dt>
            <dd className="col-span-2">
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
            <div>
              <h3 className="mb-1 text-xs font-medium text-[#014547]">Ringkasan AI</h3>
              <p className="whitespace-pre-wrap text-sm text-[#333]">{ticket.ai_summary}</p>
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
        </section>

        <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-[#E8E8E8] bg-white p-4">
          <h2 className="mb-2 shrink-0 text-sm font-semibold text-[#014547]">
            Transcript chat
          </h2>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain text-sm">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`rounded-lg px-2 py-1 ${
                  m.role === "user"
                    ? "bg-[#014547]/10"
                    : m.role === "system"
                      ? "text-center text-xs italic text-[#717171]"
                      : "bg-[#F5F5F5]"
                }`}
              >
                <span className="text-[10px] uppercase text-[#717171]">{m.role}</span>
                {m.role === "assistant" ? (
                  <ChatMarkdown content={m.content} />
                ) : (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                )}
              </div>
            ))}
            {messages.length === 0 && (
              <p className="text-xs text-[#717171]">Tidak ada transcript</p>
            )}
          </div>
        </section>

        <section className="w-full rounded-xl border border-[#E8E8E8] bg-white p-4 lg:col-span-2">
            <h2 className="mb-2 text-sm font-semibold text-[#014547]">Komentar</h2>
            <ul className="mb-4 space-y-2">
              {comments.map((c) => (
                <li
                  key={c.id}
                  className="rounded-lg border border-[#F0F0F0] px-3 py-2 text-sm"
                >
                  <p className="text-[10px] text-[#717171]">
                    {c.author_name} · {c.visibility} ·{" "}
                    {new Date(c.created_at).toLocaleString("id-ID")}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">{c.body}</p>
                </li>
              ))}
              {comments.length === 0 && (
                <li className="text-xs text-[#717171]">Belum ada komentar</li>
              )}
            </ul>
            {isStaff && (
              <form onSubmit={onComment} className="flex flex-col gap-2">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  placeholder="Tambah komentar..."
                />
                <div className="flex items-center gap-4">
                  <label className="text-xs">
                    <input
                      type="radio"
                      checked={commentVis === "internal"}
                      onChange={() => setCommentVis("internal")}
                    />{" "}
                    Internal
                  </label>
                  <label className="text-xs">
                    <input
                      type="radio"
                      checked={commentVis === "public"}
                      onChange={() => setCommentVis("public")}
                    />{" "}
                    Public (sync ke chat user)
                  </label>
                  <button
                    type="submit"
                    className="ml-auto rounded-lg bg-[#014547] px-4 py-1.5 text-xs text-white"
                  >
                    Kirim
                  </button>
                </div>
              </form>
            )}
        </section>
      </div>
    </main>
  );
}
