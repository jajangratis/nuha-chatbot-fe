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
import { TicketAssigneeAvatars } from "@/components/TicketAssigneeAvatars";
import { TicketFiltersPanel } from "@/components/TicketFiltersPanel";
import { TicketPriorityBadge } from "@/components/TicketPriorityBadge";
import {
  fetchAssignableUsers,
  fetchTickets,
  patchTicket,
  type AssignableUser,
  type Ticket,
} from "@/lib/tickets-api";
import {
  buildTicketListFetchParams,
  emptyTicketFilters,
  type TicketFilterValues,
} from "@/lib/ticket-list-filters";
import {
  getTicketStatusTheme,
  isKnownTicketStatus,
  TICKET_STATUS_ORDER,
  TICKET_STATUS_OTHER_THEME,
  type TicketStatusTheme,
} from "@/lib/ticket-status-theme";

const TICKET_ID_MIME = "application/x-nuha-ticket-id";
const BOARD_TICKET_LIMIT = 100;

export default function TicketsBoardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filters, setFilters] = useState<TicketFilterValues>(emptyTicketFilters);
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isStaff =
    user?.role === "agent" || user?.role === "admin" || user?.role === "developer";

  const assigneeFilterKey = filters.assigneeIds.join(",");
  const assignableCount = assignableUsers.length;

  useEffect(() => {
    const token = loadAuthToken();
    const authUser = loadAuthUser();
    if (!token) {
      router.replace(withBasePath("/login"));
      return;
    }
    setUser(authUser);

    if (isStaffRole(authUser?.role)) {
      void fetchAssignableUsers()
        .then((d) => setAssignableUsers(d.users))
        .catch(() => setAssignableUsers([]));
    }
  }, [router]);

  const reload = useCallback(async () => {
    const params = buildTicketListFetchParams(filters, {
      assignableCount,
      limit: BOARD_TICKET_LIMIT,
    });
    const data = await fetchTickets(params);
    setTickets(data.tickets);
  }, [
    filters.dateFrom,
    filters.dateTo,
    filters.status,
    filters.priority,
    assigneeFilterKey,
    assignableCount,
  ]);

  useEffect(() => {
    const token = loadAuthToken();
    if (!token) return;

    setLoading(true);
    setError(null);
    void reload()
      .catch((e) => setError(e instanceof Error ? e.message : "Gagal memuat tiket"))
      .finally(() => setLoading(false));
  }, [reload]);

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

  const visibleStatusColumns = filters.status
    ? TICKET_STATUS_ORDER.filter((key) => key === filters.status)
    : TICKET_STATUS_ORDER;

  const boardColumns: {
    key: string;
    theme: TicketStatusTheme;
    tickets: Ticket[];
    droppable: boolean;
  }[] = visibleStatusColumns.map((key) => ({
    key,
    theme: getTicketStatusTheme(key),
    tickets: tickets.filter((t) => t.status === key),
    droppable: true,
  }));

  if (!filters.status && tickets.some((t) => !isKnownTicketStatus(t.status))) {
    boardColumns.push({
      key: "__other__",
      theme: TICKET_STATUS_OTHER_THEME,
      tickets: tickets.filter((t) => !isKnownTicketStatus(t.status)),
      droppable: false,
    });
  }

  const hasActiveFilters =
    filters.dateFrom ||
    filters.dateTo ||
    filters.status ||
    filters.priority ||
    filters.assigneeIds.length > 0;

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
        <TicketFiltersPanel
          values={filters}
          onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
          onReset={() => setFilters(emptyTicketFilters())}
          assignableUsers={assignableUsers}
          isStaff={isStaff}
          hint="Filter diterapkan otomatis · board menampilkan maks. 100 tiket"
          ticketCountHint={
            hasActiveFilters && !loading ? `${tickets.length} tiket ditampilkan` : undefined
          }
        />
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
                      <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[#717171]">
                        <span>{t.hospital?.code ?? "—"}</span>
                        {(t.assignees?.length ?? 0) > 0 && (
                          <TicketAssigneeAvatars
                            assignees={t.assignees}
                            maxVisible={3}
                            size="xs"
                            emptyLabel=""
                          />
                        )}
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

function isStaffRole(role: AuthUser["role"] | undefined) {
  return role === "agent" || role === "admin" || role === "developer";
}
