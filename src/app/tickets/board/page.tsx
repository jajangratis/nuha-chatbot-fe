"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoggedInHeaderInfo } from "@/components/LoggedInHeaderInfo";
import { NotificationBell } from "@/components/NotificationBell";
import { loadAuthToken, loadAuthUser, type AuthUser } from "@/lib/auth-api";
import { withBasePath } from "@/lib/app-path";
import { TicketPriorityBadge } from "@/components/TicketPriorityBadge";
import { fetchTickets, patchTicket, type Ticket } from "@/lib/tickets-api";

const COLUMNS = [
  { key: "new", label: "Baru" },
  { key: "assigned", label: "Ditugaskan" },
  { key: "in_progress", label: "Dikerjakan" },
  { key: "waiting_user", label: "Tunggu user" },
  { key: "resolved", label: "Selesai" },
] as const;

const TICKET_ID_MIME = "application/x-nuha-ticket-id";

export default function TicketsBoardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const data = await fetchTickets();
    setTickets(data.tickets);
  }, []);

  useEffect(() => {
    const token = loadAuthToken();
    if (!token) {
      router.replace(withBasePath("/login"));
      return;
    }
    setUser(loadAuthUser());
    setLoading(true);
    setError(null);
    void reload()
      .catch((e) => setError(e instanceof Error ? e.message : "Gagal memuat tiket"))
      .finally(() => setLoading(false));
  }, [router, reload]);

  const moveTicket = async (ticketId: string, status: string) => {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket || ticket.status === status) return;

    const snapshot = tickets;
    setSavingId(ticketId);
    setError(null);
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status } : t)),
    );

    try {
      await patchTicket(ticketId, { status });
    } catch (e) {
      setTickets(snapshot);
      setError(e instanceof Error ? e.message : "Gagal memindahkan tiket");
    } finally {
      setSavingId(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, ticketId: string) => {
    e.dataTransfer.setData(TICKET_ID_MIME, ticketId);
    e.dataTransfer.setData("text/plain", ticketId);
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(ticketId);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setOverColumn(null);
  };

  const handleColumnDragOver = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverColumn(columnKey);
  };

  const handleColumnDrop = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    const ticketId =
      e.dataTransfer.getData(TICKET_ID_MIME) ||
      e.dataTransfer.getData("text/plain");
    setOverColumn(null);
    setDraggingId(null);
    if (ticketId) void moveTicket(ticketId, columnKey);
  };

  return (
    <main className="min-h-full bg-[#F5F5F5]">
      <header className="flex items-center justify-between bg-gradient-to-r from-[#032626] to-[#0B6463] px-4 py-3 text-white">
        <LoggedInHeaderInfo user={user} title="Board Tiket" />
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Link href={withBasePath("/tickets")} className="text-xs hover:underline">
            List view
          </Link>
        </div>
      </header>

      {error && (
        <p className="bg-amber-50 px-4 py-2 text-sm text-amber-900">{error}</p>
      )}

      <p className="px-4 pt-3 text-xs text-[#717171]">
        Seret kartu tiket ke kolom status untuk memperbarui. Lepas di atas kolom tujuan.
      </p>

      {loading ? (
        <p className="p-4 text-sm text-[#717171]">Memuat board…</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto p-4">
          {COLUMNS.map((col) => {
            const colTickets = tickets.filter((t) => t.status === col.key);
            const isOver = overColumn === col.key && draggingId != null;

            return (
              <div
                key={col.key}
                onDragOver={(e) => handleColumnDragOver(e, col.key)}
                onDrop={(e) => handleColumnDrop(e, col.key)}
                className={`w-64 shrink-0 rounded-xl border bg-white transition-colors ${
                  isOver
                    ? "border-[#07C5BA] bg-[#07C5BA]/5 ring-2 ring-[#07C5BA]/40"
                    : "border-[#E8E8E8]"
                }`}
              >
                <h2 className="flex items-center justify-between border-b px-3 py-2 text-xs font-semibold text-[#014547]">
                  <span>{col.label}</span>
                  <span className="rounded-full bg-[#F0F0F0] px-1.5 py-0.5 text-[10px] font-normal text-[#717171]">
                    {colTickets.length}
                  </span>
                </h2>
                <ul
                  className={`min-h-[120px] max-h-[70vh] space-y-2 overflow-y-auto p-2 ${
                    isOver ? "bg-[#07C5BA]/5" : ""
                  }`}
                >
                  {colTickets.map((t) => (
                    <li
                      key={t.id}
                      draggable={savingId !== t.id}
                      onDragStart={(e) => handleDragStart(e, t.id)}
                      onDragEnd={handleDragEnd}
                      className={`cursor-grab rounded-lg border border-[#F0F0F0] bg-[#FAFAFA] p-2 text-xs active:cursor-grabbing ${
                        draggingId === t.id ? "opacity-40" : ""
                      } ${savingId === t.id ? "pointer-events-none opacity-60" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <Link
                          href={withBasePath(`/tickets/${t.id}`)}
                          className="font-medium text-[#07C5BA] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                          draggable={false}
                        >
                          {t.ticket_number}
                        </Link>
                        <div className="flex shrink-0 items-center gap-1">
                          <TicketPriorityBadge priority={t.priority} />
                          {savingId === t.id && (
                            <span className="text-[10px] text-[#717171]">…</span>
                          )}
                        </div>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[#333]">{t.title}</p>
                      <p className="mt-1 text-[#717171]">
                        {t.hospital?.code ?? "—"}
                        {t.assignee_names || t.assignee_name
                          ? ` · ${t.assignee_names ?? t.assignee_name}`
                          : ""}
                      </p>
                    </li>
                  ))}
                  {colTickets.length === 0 && (
                    <li
                      className={`rounded-lg border border-dashed py-6 text-center text-[10px] ${
                        isOver
                          ? "border-[#07C5BA] text-[#014547]"
                          : "border-[#E0E0E0] text-[#9E9E9E]"
                      }`}
                    >
                      {isOver ? "Lepas di sini" : "Kosong"}
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
