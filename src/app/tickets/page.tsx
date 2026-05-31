"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SupportHubHeader } from "@/components/SupportHubHeader";
import { UserAccountMenu, UserMenuLink } from "@/components/UserAccountMenu";
import { NotificationBell } from "@/components/NotificationBell";
import {
  loadAuthToken,
  loadAuthUser,
  logout,
  type AuthUser,
} from "@/lib/auth-api";
import { withBasePath } from "@/lib/app-path";
import { TicketAssigneeAvatars } from "@/components/TicketAssigneeAvatars";
import { TicketFiltersPanel } from "@/components/TicketFiltersPanel";
import { TicketPriorityBadge } from "@/components/TicketPriorityBadge";
import {
  fetchAssignableUsers,
  fetchTickets,
  type AssignableUser,
  type Ticket,
  type TicketsPagination,
} from "@/lib/tickets-api";
import {
  buildTicketListFetchParams,
  emptyTicketFilters,
} from "@/lib/ticket-list-filters";
import {
  getTicketStatusTheme,
  isKnownTicketStatus,
  TICKET_STATUS_ORDER,
  TICKET_STATUS_OTHER_THEME,
  ticketStatusLabel,
} from "@/lib/ticket-status-theme";

function formatCreatedAt(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(key: string) {
  return ticketStatusLabel(key);
}

function TicketTable({
  rows,
  showStatusColumn = true,
}: {
  rows: Ticket[];
  showStatusColumn?: boolean;
}) {
  const colCount = showStatusColumn ? 7 : 6;

  return (
    <table className="w-full text-left text-sm">
      <thead className="border-b bg-[#FAFAFA] text-xs text-[#717171]">
        <tr>
          <th className="px-3 py-2">Nomor</th>
          <th className="px-3 py-2">Judul</th>
          <th className="px-3 py-2">RS</th>
          {showStatusColumn && <th className="px-3 py-2">Status</th>}
          <th className="px-3 py-2">Prioritas</th>
          <th className="px-3 py-2 whitespace-nowrap">Dibuat</th>
          <th className="px-3 py-2">Assignee</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((t) => (
          <tr key={t.id} className="border-b border-[#F0F0F0] hover:bg-[#F9F9F9]">
            <td className="px-3 py-2">
              <Link
                href={withBasePath(`/tickets/${t.id}`)}
                className="font-medium text-[#07C5BA] hover:underline"
              >
                {t.ticket_number}
              </Link>
            </td>
            <td className="max-w-[200px] truncate px-3 py-2">{t.title}</td>
            <td className="px-3 py-2">{t.hospital?.code ?? "—"}</td>
            {showStatusColumn && (
              <td className="px-3 py-2">{statusLabel(t.status)}</td>
            )}
            <td className="px-3 py-2">
              <TicketPriorityBadge priority={t.priority} />
            </td>
            <td className="whitespace-nowrap px-3 py-2 text-xs text-[#717171]">
              {formatCreatedAt(t.created_at)}
            </td>
            <td className="px-3 py-2">
              <TicketAssigneeAvatars assignees={t.assignees} />
            </td>
          </tr>
        ))}
        {rows.length === 0 && (
          <tr>
            <td colSpan={colCount} className="px-3 py-6 text-center text-[#717171]">
              —
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function TicketsPaginationBar({
  pagination,
  onPageChange,
}: {
  pagination: TicketsPagination;
  onPageChange: (page: number) => void;
}) {
  const { page, totalPages, total, limit } = pagination;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E8E8E8] bg-white px-3 py-3 text-sm text-[#014547]">
      <p className="text-xs text-[#717171]">
        Menampilkan {from}–{to} dari {total} tiket
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border border-[#E8E8E8] px-3 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[#F5F5F5]"
        >
          Sebelumnya
        </button>
        <span className="px-1 text-xs text-[#717171]">
          Halaman {page} / {totalPages || 1}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border border-[#E8E8E8] px-3 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[#F5F5F5]"
        >
          Berikutnya
        </button>
      </div>
    </div>
  );
}

export default function TicketsListPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filters, setFilters] = useState(emptyTicketFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pagination, setPagination] = useState<TicketsPagination | null>(null);
  const [groupByStatus, setGroupByStatus] = useState(true);
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isStaff = user?.role === "agent" || user?.role === "admin" || user?.role === "developer";

  useEffect(() => {
    const token = loadAuthToken();
    const authUser = loadAuthUser();
    if (!token) {
      router.replace(withBasePath("/login"));
      return;
    }
    setUser(authUser);

    if (
      authUser &&
      (authUser.role === "agent" ||
        authUser.role === "admin" ||
        authUser.role === "developer")
    ) {
      void fetchAssignableUsers()
        .then((d) => setAssignableUsers(d.users))
        .catch(() => setAssignableUsers([]));
    }
  }, [router]);

  const assigneeFilterKey = filters.assigneeIds.join(",");
  const assignableCount = assignableUsers.length;

  const patchFilters = (patch: Partial<typeof filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  useEffect(() => {
    const token = loadAuthToken();
    if (!token) return;

    setLoading(true);
    setError(null);
    const params = buildTicketListFetchParams(filters, {
      assignableCount,
      page,
      limit: pageSize,
    });

    void fetchTickets(params)
      .then((d) => {
        setTickets(d.tickets);
        setPagination(d.pagination ?? null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Gagal memuat"))
      .finally(() => setLoading(false));
  }, [
    filters.dateFrom,
    filters.dateTo,
    filters.status,
    filters.priority,
    assigneeFilterKey,
    assignableCount,
    page,
    pageSize,
  ]);

  return (
    <main className="min-h-full bg-[#F5F5F5]">
      <SupportHubHeader
        title="Tiket Gangguan"
        subtitle="Nuha Care TMS"
        user={user}
      >
        <NotificationBell />
        <Link href={withBasePath("/tickets/board")} className="rounded-lg px-2 py-1 text-xs hover:bg-white/10">
          Board
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

      <div className="mx-auto max-w-5xl p-4">
        <TicketFiltersPanel
          className="mb-4"
          values={filters}
          onChange={patchFilters}
          onReset={() => {
            setFilters(emptyTicketFilters());
            setPage(1);
          }}
          assignableUsers={assignableUsers}
          isStaff={isStaff}
          listOptions={{
            pageSize,
            onPageSizeChange: (size) => {
              setPageSize(size);
              setPage(1);
            },
            groupByStatus,
            onGroupByStatusChange: setGroupByStatus,
          }}
        />

        {groupByStatus && !loading && tickets.length > 0 && (
          <p className="mb-3 text-xs text-[#717171]">
            Kelompok status berlaku untuk tiket di halaman ini saja.
          </p>
        )}

        {error && (
          <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{error}</p>
        )}

        {loading ? (
          <p className="text-sm text-[#717171]">Memuat tiket…</p>
        ) : tickets.length === 0 ? (
          <p className="rounded-xl border border-[#E8E8E8] bg-white px-3 py-8 text-center text-sm text-[#717171]">
            Belum ada tiket
          </p>
        ) : groupByStatus ? (
          <div className="space-y-4">
            {(filters.status
              ? TICKET_STATUS_ORDER.filter((key) => key === filters.status)
              : TICKET_STATUS_ORDER
            ).map((key) => {
              const group = tickets.filter((t) => t.status === key);
              if (!group.length) return null;
              const theme = getTicketStatusTheme(key);
              return (
                <section
                  key={key}
                  className={`overflow-hidden rounded-xl border border-[#E8E8E8] border-l-4 bg-white ${theme.sectionAccent}`}
                >
                  <h2
                    className={`flex items-center gap-2 px-3 py-2.5 text-xs font-semibold ${theme.header}`}
                  >
                    <span>{theme.label}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${theme.count}`}
                    >
                      {group.length}
                    </span>
                  </h2>
                  <TicketTable rows={group} showStatusColumn={false} />
                </section>
              );
            })}
            {tickets.some((t) => !isKnownTicketStatus(t.status)) && (
              <section
                className={`overflow-hidden rounded-xl border border-[#E8E8E8] border-l-4 bg-white ${TICKET_STATUS_OTHER_THEME.sectionAccent}`}
              >
                <h2
                  className={`flex items-center gap-2 px-3 py-2.5 text-xs font-semibold ${TICKET_STATUS_OTHER_THEME.header}`}
                >
                  <span>{TICKET_STATUS_OTHER_THEME.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${TICKET_STATUS_OTHER_THEME.count}`}
                  >
                    {tickets.filter((t) => !isKnownTicketStatus(t.status)).length}
                  </span>
                </h2>
                <TicketTable
                  rows={tickets.filter((t) => !isKnownTicketStatus(t.status))}
                  showStatusColumn
                />
              </section>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#E8E8E8] bg-white">
            <TicketTable rows={tickets} showStatusColumn />
          </div>
        )}

        {pagination && !loading && tickets.length > 0 && (
          <TicketsPaginationBar
            pagination={pagination}
            onPageChange={setPage}
          />
        )}

        {pagination && !loading && tickets.length === 0 && (
          <p className="mt-3 text-center text-xs text-[#717171]">
            Tidak ada tiket pada filter ini
            {pagination.total > 0 ? ` (${pagination.total} total)` : ""}.
          </p>
        )}
      </div>
    </main>
  );
}
