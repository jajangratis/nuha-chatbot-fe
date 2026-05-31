import type { fetchTickets } from "@/lib/tickets-api";
import { TICKET_STATUS_ORDER, ticketStatusLabel } from "@/lib/ticket-status-theme";

export const TICKET_STATUS_FILTER_OPTIONS = ["", ...TICKET_STATUS_ORDER] as const;

export type TicketFilterValues = {
  dateFrom: string;
  dateTo: string;
  status: string;
  priority: string;
  assigneeIds: string[];
};

export const emptyTicketFilters = (): TicketFilterValues => ({
  dateFrom: "",
  dateTo: "",
  status: "",
  priority: "",
  assigneeIds: [],
});

export function ticketStatusFilterLabel(key: string) {
  return key ? ticketStatusLabel(key) : "Semua status";
}

type FetchParams = NonNullable<Parameters<typeof fetchTickets>[0]>;

export function buildTicketListFetchParams(
  filters: TicketFilterValues,
  opts: {
    assignableCount: number;
    page?: number;
    limit?: number;
  },
): FetchParams {
  const params: FetchParams = {};

  if (opts.page != null) {
    params.page = opts.page;
    params.limit = opts.limit ?? 20;
  } else if (opts.limit != null) {
    params.limit = opts.limit;
  }

  if (filters.status) params.status = filters.status;
  if (filters.priority) params.priority = filters.priority;
  if (filters.dateFrom) params.date_from = filters.dateFrom;
  if (filters.dateTo) params.date_to = filters.dateTo;

  const allStaffSelected =
    opts.assignableCount > 0 && filters.assigneeIds.length === opts.assignableCount;
  if (filters.assigneeIds.length && !allStaffSelected) {
    params.assignee_ids = filters.assigneeIds;
  }

  return params;
}
