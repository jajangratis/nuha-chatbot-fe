"use client";

import { userAvatarInitial } from "@/lib/auth-api";
import {
  formatAssigneeLabel,
  type TicketAssignee,
} from "@/lib/tickets-api";

const SIZE_CLASS = {
  xs: "h-7 w-7 text-[11px] ring-[1.5px]",
  sm: "h-8 w-8 text-xs ring-2",
  md: "h-10 w-10 text-sm ring-2",
} as const;

type Props = {
  assignees?: TicketAssignee[];
  /** Maks. avatar yang ditampilkan sebelum "+N". */
  maxVisible?: number;
  size?: keyof typeof SIZE_CLASS;
  emptyLabel?: string;
};

function AssigneeAvatar({
  user,
  size,
  zIndex,
}: {
  user: TicketAssignee;
  size: keyof typeof SIZE_CLASS;
  zIndex: number;
}) {
  return (
    <span
      title={formatAssigneeLabel(user)}
      style={{ zIndex }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#639B15] to-[#07C5BA] font-semibold text-white shadow-sm ring-white ${SIZE_CLASS[size]}`}
    >
      {userAvatarInitial(user)}
    </span>
  );
}

export function TicketAssigneeAvatars({
  assignees = [],
  maxVisible = 5,
  size = "xs",
  emptyLabel = "—",
}: Props) {
  if (!assignees.length) {
    return <span className="text-[#717171]">{emptyLabel}</span>;
  }

  const visible = assignees.slice(0, maxVisible);
  const overflow = assignees.length - visible.length;
  const overflowTitle = assignees
    .slice(maxVisible)
    .map((a) => formatAssigneeLabel(a))
    .join(", ");

  return (
    <div className="flex items-center" role="group" aria-label={assignees.map((a) => a.display_name).join(", ")}>
      <div className="flex items-center -space-x-2">
        {visible.map((a, i) => (
          <AssigneeAvatar
            key={a.id}
            user={a}
            size={size}
            zIndex={visible.length - i}
          />
        ))}
        {overflow > 0 && (
          <span
            title={overflowTitle}
            style={{ zIndex: 0 }}
            className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[#E8E8E8] font-semibold text-[#014547] ring-white ${SIZE_CLASS[size]}`}
          >
            +{overflow}
          </span>
        )}
      </div>
    </div>
  );
}
