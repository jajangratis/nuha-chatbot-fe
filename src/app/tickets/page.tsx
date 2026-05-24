"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoggedInHeaderInfo } from "@/components/LoggedInHeaderInfo";
import { useAuthSession } from "@/hooks/use-auth-session";
import { logout } from "@/lib/auth-api";
import { withBasePath } from "@/lib/app-path";
import { fetchTickets, type Ticket } from "@/lib/tickets-api";

const STATUS_OPTIONS = [
  "",
  "new",
  "assigned",
  "in_progress",
  "waiting_user",
  "resolved",
  "closed",
];

export default function TicketsListPage() {
  const router = useRouter();
  const { ready, token, user } = useAuthSession();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !token) {
      return;
    }

    setLoading(true);
    setError(null);
    void fetchTickets(statusFilter ? { status: statusFilter } : undefined)
      .then((d) => setTickets(d.tickets))
      .catch((e) => setError(e instanceof Error ? e.message : "Gagal memuat"))
      .finally(() => setLoading(false));
  }, [ready, token, statusFilter]);

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
        <div className="mb-4 flex items-center gap-3">
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
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{error}</p>
        )}

        {!ready || loading ? (
          <p className="text-sm text-[#717171]">Memuat...</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#E8E8E8] bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-[#FAFAFA] text-xs text-[#717171]">
                <tr>
                  <th className="px-3 py-2">Nomor</th>
                  <th className="px-3 py-2">Judul</th>
                  <th className="px-3 py-2">RS</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Prioritas</th>
                  <th className="px-3 py-2">Assignee</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
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
                    <td className="px-3 py-2">{t.status}</td>
                    <td className="px-3 py-2">{t.priority}</td>
                    <td className="px-3 py-2">
                      {t.assignee_names ?? t.assignee_name ?? "—"}
                    </td>
                  </tr>
                ))}
                {tickets.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-[#717171]">
                      Belum ada tiket
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
