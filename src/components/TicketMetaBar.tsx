"use client";

import type { ReactNode } from "react";
import { TicketPriorityBadge } from "@/components/TicketPriorityBadge";
import {
  formatTicketPriority,
  TICKET_PRIORITIES,
  ticketPrioritySelectClass,
  type TicketPriority,
} from "@/lib/ticket-priority";
import {
  getTicketStatusTheme,
  TICKET_STATUS_ORDER,
  ticketStatusLabel,
} from "@/lib/ticket-status-theme";
import { nuhaMetaBarClass, nuhaPanelTitleClass } from "@/lib/nuha-support-theme";

type Props = {
  status: string;
  priority: string;
  hospitalName?: string | null;
  module?: string | null;
  isStaff: boolean;
  onStatusChange?: (status: string) => void;
  onPriorityChange?: (priority: TicketPriority) => void;
};

export function TicketMetaBar({
  status,
  priority,
  hospitalName,
  module,
  isStaff,
  onStatusChange,
  onPriorityChange,
}: Props) {
  const statusTheme = getTicketStatusTheme(status);

  return (
    <div className={`flex flex-wrap items-center gap-x-6 gap-y-3 ${nuhaMetaBarClass}`}>
      <MetaField label="Status">
        {isStaff && onStatusChange ? (
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className={`cursor-pointer rounded-md border-0 px-2.5 py-1 text-xs font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-[#07C5BA]/30 ${statusTheme.count}`}
          >
            {TICKET_STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {ticketStatusLabel(s)}
              </option>
            ))}
          </select>
        ) : (
          <span
            className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${statusTheme.count}`}
          >
            {statusTheme.label}
          </span>
        )}
      </MetaField>

      <MetaField label="Prioritas">
        {isStaff && onPriorityChange ? (
          <div className="flex items-center gap-2">
            <TicketPriorityBadge priority={priority} variant="dot" />
            <select
              value={priority}
              onChange={(e) => onPriorityChange(e.target.value as TicketPriority)}
              className={`rounded-md border bg-white px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 ${ticketPrioritySelectClass(priority)}`}
            >
              {TICKET_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {formatTicketPriority(p)}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <TicketPriorityBadge priority={priority} />
        )}
      </MetaField>

      {hospitalName && (
        <MetaField label="RS">
          <span className="text-sm font-medium text-[#014547]">{hospitalName}</span>
        </MetaField>
      )}

      {module && (
        <MetaField label="Modul">
          <span className="text-sm font-medium text-[#014547]">{module}</span>
        </MetaField>
      )}
    </div>
  );
}

function MetaField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-[5rem] flex-col gap-1">
      <span className={nuhaPanelTitleClass}>
        {label}
      </span>
      <div>{children}</div>
    </div>
  );
}
