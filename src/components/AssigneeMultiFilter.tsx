"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { userAvatarInitial } from "@/lib/auth-api";
import { filterControlClass } from "@/components/TicketFilterPanel";
import { type AssignableUser } from "@/lib/tickets-api";

type Props = {
  users: AssignableUser[];
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
};

export function AssigneeMultiFilter({
  users,
  value = [],
  onChange,
  disabled = false,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const selected = useMemo(
    () => users.filter((u) => value.includes(u.id)),
    [users, value],
  );

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const allSelected = users.length > 0 && value.length === users.length;
  const noneSelected = value.length === 0;

  const selectAll = () => {
    if (disabled || !users.length) return;
    onChange(users.map((u) => u.id));
  };

  const clearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  const toggle = (userId: string) => {
    if (disabled) return;
    if (value.includes(userId)) {
      onChange(value.filter((id) => id !== userId));
    } else {
      onChange([...value, userId]);
    }
  };

  const label =
    noneSelected || allSelected
      ? "Semua orang"
      : selected.length === 1
        ? selected[0].display_name
        : `${selected.length} orang`;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`${filterControlClass} flex h-[42px] items-center gap-2 text-left`}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {selected.length > 0 && (
          <span className="flex shrink-0 -space-x-1.5">
            {selected.slice(0, 3).map((u, i) => (
              <span
                key={u.id}
                style={{ zIndex: 3 - i }}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#639B15] to-[#07C5BA] text-[10px] font-bold text-white ring-2 ring-white"
                title={u.display_name}
              >
                {userAvatarInitial(u)}
              </span>
            ))}
            {selected.length > 3 && (
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#E8E8E8] text-[9px] font-semibold text-[#014547] ring-2 ring-white">
                +{selected.length - 3}
              </span>
            )}
          </span>
        )}
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <span className="shrink-0 text-[#717171]" aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-30 mt-1 overflow-hidden rounded-lg border border-[#E0F7F5] bg-white shadow-lg ring-1 ring-[#07C5BA]/10">
          <div className="flex gap-1 border-b border-[#E0F7F5] bg-[#FAFCFC] p-1.5">
            <button
              type="button"
              disabled={disabled || !users.length}
              onMouseDown={(e) => e.preventDefault()}
              onClick={selectAll}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition ${
                allSelected
                  ? "bg-[#07C5BA]/15 text-[#014547]"
                  : "text-[#014547] hover:bg-[#E8F9F8]"
              }`}
            >
              Semua orang
            </button>
            <button
              type="button"
              disabled={disabled}
              onMouseDown={(e) => e.preventDefault()}
              onClick={clearAll}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition ${
                noneSelected
                  ? "bg-[#07C5BA]/15 text-[#014547]"
                  : "text-[#5A7A78] hover:bg-[#F4FAFA]"
              }`}
            >
              Reset
            </button>
          </div>
          <ul className="max-h-44 overflow-y-auto py-1" role="listbox" aria-multiselectable>
          {users.map((u) => {
            const checked = value.includes(u.id);
            return (
              <li key={u.id} role="option" aria-selected={checked}>
                <button
                  type="button"
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition ${
                    checked ? "bg-[#E8F9F8] text-[#014547]" : "hover:bg-[#F4FAFA]"
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => toggle(u.id)}
                >
                  <input
                    type="checkbox"
                    readOnly
                    checked={checked}
                    className="h-3.5 w-3.5 rounded border-[#CFCFCF] text-[#07C5BA]"
                    tabIndex={-1}
                  />
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#639B15] to-[#07C5BA] text-[10px] font-bold text-white">
                    {userAvatarInitial(u)}
                  </span>
                  <span className="min-w-0 truncate font-medium">{u.display_name}</span>
                </button>
              </li>
            );
          })}
          {users.length === 0 && (
            <li className="px-3 py-2 text-xs text-[#717171]">Tidak ada staff</li>
          )}
          </ul>
        </div>
      )}
    </div>
  );
}
