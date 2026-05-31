"use client";

import { AssigneeMultiFilter } from "@/components/AssigneeMultiFilter";
import {
  filterControlClass,
  TicketFilterCard,
  TicketFilterField,
  TicketFilterHint,
  TicketFilterResetButton,
} from "@/components/TicketFilterPanel";
import { formatTicketPriority, TICKET_PRIORITIES } from "@/lib/ticket-priority";
import {
  TICKET_STATUS_FILTER_OPTIONS,
  ticketStatusFilterLabel,
  type TicketFilterValues,
} from "@/lib/ticket-list-filters";
import type { AssignableUser } from "@/lib/tickets-api";

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export type TicketListFilterOptions = {
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  groupByStatus: boolean;
  onGroupByStatusChange: (value: boolean) => void;
};

type Props = {
  values: TicketFilterValues;
  onChange: (patch: Partial<TicketFilterValues>) => void;
  onReset: () => void;
  assignableUsers: AssignableUser[];
  isStaff: boolean;
  /** Hanya halaman list — pagination & kelompok status */
  listOptions?: TicketListFilterOptions;
  className?: string;
  hint?: string;
  ticketCountHint?: string;
};

export function TicketFiltersPanel({
  values,
  onChange,
  onReset,
  assignableUsers,
  isStaff,
  listOptions,
  className = "",
  hint = "Filter diterapkan otomatis saat nilai diubah.",
  ticketCountHint,
}: Props) {
  return (
    <TicketFilterCard
      className={className}
      footer={
        <>
          <TicketFilterResetButton onClick={onReset} />
          <TicketFilterHint>
            {hint}
            {ticketCountHint ? ` · ${ticketCountHint}` : ""}
          </TicketFilterHint>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <TicketFilterField label="Tanggal awal">
          <input
            type="date"
            value={values.dateFrom}
            onChange={(e) => onChange({ dateFrom: e.target.value })}
            className={filterControlClass}
          />
        </TicketFilterField>
        <TicketFilterField label="Tanggal akhir">
          <input
            type="date"
            value={values.dateTo}
            onChange={(e) => onChange({ dateTo: e.target.value })}
            className={filterControlClass}
          />
        </TicketFilterField>
        <TicketFilterField label="Status">
          <select
            value={values.status}
            onChange={(e) => onChange({ status: e.target.value })}
            className={filterControlClass}
          >
            {TICKET_STATUS_FILTER_OPTIONS.map((s) => (
              <option key={s || "all"} value={s}>
                {ticketStatusFilterLabel(s)}
              </option>
            ))}
          </select>
        </TicketFilterField>
        <TicketFilterField label="Prioritas">
          <select
            value={values.priority}
            onChange={(e) => onChange({ priority: e.target.value })}
            className={filterControlClass}
          >
            <option value="">Semua prioritas</option>
            {TICKET_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {formatTicketPriority(p)}
              </option>
            ))}
          </select>
        </TicketFilterField>
        {isStaff && (
          <TicketFilterField label="Assignee">
            <AssigneeMultiFilter
              users={assignableUsers}
              value={values.assigneeIds}
              onChange={(assigneeIds) => onChange({ assigneeIds })}
            />
          </TicketFilterField>
        )}
      </div>

      {listOptions && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <TicketFilterField label="Per halaman">
            <select
              value={listOptions.pageSize}
              onChange={(e) => listOptions.onPageSizeChange(Number(e.target.value))}
              className={filterControlClass}
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n} tiket
                </option>
              ))}
            </select>
          </TicketFilterField>
          <TicketFilterField label="Tampilan" className="sm:col-span-2">
            <label className="flex h-[42px] cursor-pointer items-center gap-2 rounded-lg border border-[#E0E0E0] bg-[#FAFAFA] px-3 text-sm text-[#014547] shadow-sm">
              <input
                type="checkbox"
                checked={listOptions.groupByStatus}
                onChange={(e) => listOptions.onGroupByStatusChange(e.target.checked)}
                className="h-4 w-4 rounded border-[#CFCFCF] text-[#07C5BA] focus:ring-[#07C5BA]/30"
              />
              Kelompokkan per status
            </label>
          </TicketFilterField>
        </div>
      )}
    </TicketFilterCard>
  );
}
