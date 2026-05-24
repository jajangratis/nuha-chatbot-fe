"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoggedInHeaderInfo } from "@/components/LoggedInHeaderInfo";
import {
  loadAuthToken,
  loadAuthUser,
  logout,
  type AuthUser,
} from "@/lib/auth-api";
import { withBasePath } from "@/lib/app-path";
import { TicketPriorityBadge } from "@/components/TicketPriorityBadge";
import { fetchTickets, type Ticket } from "@/lib/tickets-api";
import { formatTicketPriority, TICKET_PRIORITIES } from "@/lib/ticket-priority";

const STATUS_OPTIONS = [
  "",
  "new",
  "assigned",
  "in_progress",
  "waiting_user",
  "resolved",
  "closed",
  "rejected",
  "duplicate",
];

const STATUS_GROUPS = [
  { key: "new", label: "Baru" },
  { key: "assigned", label: "Ditugaskan" },
  { key: "in_progress", label: "Dikerjakan" },
  { key: "waiting_user", label: "Menunggu user" },
  { key: "resolved", label: "Selesai" },
  { key: "closed", label: "Ditutup" },
  { key: "rejected", label: "Ditolak" },
  { key: "duplicate", label: "Duplikat" },
] as const;

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
  return STATUS_GROUPS.find((s) => s.key === key)?.label ?? key;
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
              {t.assignee_names ?? t.assignee_name ?? "—"}
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

export default function TicketsListPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [groupByStatus, setGroupByStatus] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = loadAuthToken();
    const authUser = loadAuthUser();
    if (!token) {
      router.replace(withBasePath("/login"));
      return;
    }
    setUser(authUser);

    setLoading(true);
    setError(null);
    const params: { status?: string; priority?: string } = {};
    if (statusFilter) params.status = statusFilter;
    if (priorityFilter) params.priority = priorityFilter;

    void fetchTickets(Object.keys(params).length ? params : undefined)
      .then((d) => setTickets(d.tickets))
      .catch((e) => setError(e instanceof Error ? e.message : "Gagal memuat"))
      .finally(() => setLoading(false));
  }, [router, statusFilter, priorityFilter]);

  return (
    <main className="min-h-full bg-[#F5F5F5]">
      <header className="flex items-center justify-between bg-gradient-to-r from-[#032626] to-[#0B6463] px-4 py-3 text-white">
        <LoggedInHeaderInfo
          user={user}
          title="Tiket Gangguan"
          subtitle="Nuha Care TMS"
        />
        <nav className="flex gap-2 text-xs">
          {user?.role !== "user" && (
            <Link href={withBasePath("/agent")} className="rounded-lg px-2 py-1 hover:bg-white/10">
              Chat
            </Link>
          )}
          {user?.role === "user" && (
            <Link href={withBasePath("/support")} className="rounded-lg px-2 py-1 hover:bg-white/10">
              Support
            </Link>
          )}
          <Link href={withBasePath("/tickets/board")} className="rounded-lg px-2 py-1 hover:bg-white/10">
            Board
          </Link>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push(withBasePath("/login"));
            }}
            className="rounded-lg px-2 py-1 hover:bg-white/10"
          >
            Keluar
          </button>
        </nav>
      </header>

      <div className="mx-auto max-w-5xl p-4">
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <label className="text-sm text-[#014547]">
            Status
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="ml-2 rounded border px-2 py-1 text-sm"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s || "all"} value={s}>
                  {s || "Semua"}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-[#014547]">
            Prioritas
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="ml-2 rounded border px-2 py-1 text-sm"
            >
              <option value="">Semua</option>
              {TICKET_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {formatTicketPriority(p)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-[#014547]">
            <input
              type="checkbox"
              checked={groupByStatus}
              onChange={(e) => setGroupByStatus(e.target.checked)}
              className="rounded border-[#E8E8E8]"
            />
            Kelompokkan per status
          </label>
        </div>

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
            {(statusFilter
              ? STATUS_GROUPS.filter((s) => s.key === statusFilter)
              : STATUS_GROUPS
            ).map(({ key, label }) => {
              const group = tickets.filter((t) => t.status === key);
              if (!group.length) return null;
              return (
                <section
                  key={key}
                  className="overflow-hidden rounded-xl border border-[#E8E8E8] bg-white"
                >
                  <h2 className="border-b border-[#F0F0F0] bg-[#FAFAFA] px-3 py-2 text-xs font-semibold text-[#014547]">
                    {label}
                    <span className="ml-2 font-normal text-[#717171]">({group.length})</span>
                  </h2>
                  <TicketTable rows={group} showStatusColumn={false} />
                </section>
              );
            })}
            {tickets.some(
              (t) => !STATUS_GROUPS.some((s) => s.key === t.status),
            ) && (
              <section className="overflow-hidden rounded-xl border border-[#E8E8E8] bg-white">
                <h2 className="border-b border-[#F0F0F0] bg-[#FAFAFA] px-3 py-2 text-xs font-semibold text-[#014547]">
                  Lainnya
                </h2>
                <TicketTable
                  rows={tickets.filter(
                    (t) => !STATUS_GROUPS.some((s) => s.key === t.status),
                  )}
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
      </div>
    </main>
  );
}
