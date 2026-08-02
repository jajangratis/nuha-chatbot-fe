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

export const INITIAL_TICKET_FILTERS: TicketFilterValues = {
  dateFrom: "",
  dateTo: "",
  status: "",
  priority: "",
  assigneeIds: [],
};

export function emptyTicketFilters(): TicketFilterValues {
  return {
    ...INITIAL_TICKET_FILTERS,
    assigneeIds: [],
  };
}

export function normalizeTicketFilters(
  values: Partial<TicketFilterValues> | null | undefined,
): TicketFilterValues {
  return {
    dateFrom: values?.dateFrom ?? "",
    dateTo: values?.dateTo ?? "",
    status: values?.status ?? "",
    priority: values?.priority ?? "",
    assigneeIds: Array.isArray(values?.assigneeIds) ? values.assigneeIds : [],
  };
}

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

  const assigneeIds = filters.assigneeIds ?? [];
  const allStaffSelected =
    opts.assignableCount > 0 && assigneeIds.length === opts.assignableCount;
  if (assigneeIds.length && !allStaffSelected) {
    params.assignee_ids = assigneeIds;
  }

  return params;
}
