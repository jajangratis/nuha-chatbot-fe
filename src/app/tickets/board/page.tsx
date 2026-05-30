"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SupportHubHeader } from "@/components/SupportHubHeader";
import { UserAccountMenu, UserMenuLink } from "@/components/UserAccountMenu";
import { logout } from "@/lib/auth-api";
import { NotificationBell } from "@/components/NotificationBell";
import { loadAuthToken, loadAuthUser, type AuthUser } from "@/lib/auth-api";
import { withBasePath } from "@/lib/app-path";
import { TicketPriorityBadge } from "@/components/TicketPriorityBadge";
import {
  filterControlClass,
  TicketFilterCard,
  TicketFilterField,
  TicketFilterHint,
  TicketFilterResetButton,
} from "@/components/TicketFilterPanel";
import { fetchTickets, patchTicket, type Ticket } from "@/lib/tickets-api";
import {
  getTicketStatusTheme,
  isKnownTicketStatus,
  TICKET_STATUS_ORDER,
  TICKET_STATUS_OTHER_THEME,
  type TicketStatusTheme,
} from "@/lib/ticket-status-theme";

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
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const reload = useCallback(async () => {
    const params: { date_from?: string; date_to?: string } = {};
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    const data = await fetchTickets(params);
    setTickets(data.tickets);
  }, [dateFrom, dateTo]);

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

  const boardColumns: {
    key: string;
    theme: TicketStatusTheme;
    tickets: Ticket[];
    droppable: boolean;
  }[] = TICKET_STATUS_ORDER.map((key) => ({
    key,
    theme: getTicketStatusTheme(key),
    tickets: tickets.filter((t) => t.status === key),
    droppable: true,
  }));

  if (tickets.some((t) => !isKnownTicketStatus(t.status))) {
    boardColumns.push({
      key: "__other__",
      theme: TICKET_STATUS_OTHER_THEME,
      tickets: tickets.filter((t) => !isKnownTicketStatus(t.status)),
      droppable: false,
    });
  }

  return (
    <main className="min-h-full bg-[#F5F5F5]">
      <SupportHubHeader title="Board Tiket" user={user}>
        <NotificationBell />
        <Link
          href={withBasePath("/tickets")}
          className="rounded-lg px-2 py-1 text-xs hover:bg-white/10"
        >
          List
        </Link>
        <UserAccountMenu
          user={user}
          onLogout={() => {
            logout();
            router.push(withBasePath("/login"));
          }}
        >
          {user?.role !== "user" && (
            <UserMenuLink href={withBasePath("/agent")}>Chat implementator</UserMenuLink>
          )}
          {user?.role === "user" && (
            <UserMenuLink href={withBasePath("/support")}>Support chat</UserMenuLink>
          )}
        </UserAccountMenu>
      </SupportHubHeader>

      {error && (
        <p className="bg-amber-50 px-4 py-2 text-sm text-amber-900">{error}</p>
      )}

      <div className="px-4 pt-3">
        <TicketFilterCard
          footer={
            <>
              <TicketFilterResetButton
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                }}
              />
              <TicketFilterHint>
                Filter tanggal dibuat · diterapkan otomatis
                {(dateFrom || dateTo) && !loading
                  ? ` · ${tickets.length} tiket ditampilkan`
                  : ""}
              </TicketFilterHint>
            </>
          }
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <TicketFilterField label="Tanggal awal">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className={filterControlClass}
              />
            </TicketFilterField>
            <TicketFilterField label="Tanggal akhir">
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className={filterControlClass}
              />
            </TicketFilterField>
          </div>
        </TicketFilterCard>
      </div>

      <p className="px-4 pt-2 text-xs text-[#717171]">
        Seret kartu tiket ke kolom status untuk memperbarui. Lepas di atas kolom tujuan.
      </p>

      {loading ? (
        <p className="p-4 text-sm text-[#717171]">Memuat board…</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto p-4">
          {boardColumns.map((col) => {
            const { key: colKey, theme, tickets: colTickets, droppable } = col;
            const isOver =
              droppable && overColumn === colKey && draggingId != null;

            return (
              <div
                key={colKey}
                onDragOver={
                  droppable
                    ? (e) => handleColumnDragOver(e, colKey)
                    : undefined
                }
                onDrop={
                  droppable ? (e) => handleColumnDrop(e, colKey) : undefined
                }
                className={`w-56 shrink-0 overflow-hidden rounded-xl border border-l-4 bg-white transition-colors ${theme.sectionAccent} ${
                  isOver
                    ? "border-[#07C5BA] bg-[#07C5BA]/5 ring-2 ring-[#07C5BA]/40"
                    : "border-[#E8E8E8]"
                }`}
              >
                <h2
                  className={`flex items-center justify-between px-3 py-2 text-xs font-semibold ${theme.header}`}
                >
                  <span>{theme.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${theme.count}`}
                  >
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
