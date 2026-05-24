"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  formatAssigneeLabel,
  type AssignableUser,
} from "@/lib/tickets-api";

type Props = {
  users: AssignableUser[];
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
};

export function AssigneeSearchSelect({
  users,
  value,
  onChange,
  disabled = false,
  loading = false,
  placeholder = "Cari nama atau username…",
}: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const selectedUsers = useMemo(
    () => users.filter((u) => value.includes(u.id)),
    [users, value],
  );

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users
      .filter((u) => !value.includes(u.id))
      .filter((u) => {
        if (!q) return true;
        return (
          u.display_name.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          u.role.toLowerCase().includes(q)
        );
      })
      .slice(0, 12);
  }, [users, value, query]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const addUser = (userId: string) => {
    if (disabled || value.includes(userId)) return;
    onChange([...value, userId]);
    setQuery("");
    inputRef.current?.focus();
  };

  const removeUser = (userId: string) => {
    if (disabled) return;
    onChange(value.filter((id) => id !== userId));
  };

  return (
    <div ref={rootRef} className="space-y-2">
      {selectedUsers.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {selectedUsers.map((u) => (
            <li key={u.id}>
              <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-[#07C5BA]/30 bg-[#07C5BA]/10 px-2 py-0.5 text-[10px] text-[#014547]">
                <span className="truncate">{formatAssigneeLabel(u)}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeUser(u.id)}
                    className="shrink-0 rounded-full px-0.5 text-[#717171] hover:bg-[#07C5BA]/20 hover:text-[#014547]"
                    aria-label={`Hapus ${u.display_name}`}
                  >
                    ×
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          type="search"
          value={query}
          disabled={disabled || loading}
          placeholder={loading ? "Memuat daftar tim…" : placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              return;
            }
            if (e.key === "Enter" && options[0]) {
              e.preventDefault();
              addUser(options[0].id);
            }
          }}
          className="w-full rounded-lg border border-[#E8E8E8] px-2.5 py-1.5 text-xs text-[#014547] placeholder:text-[#9E9E9E] focus:border-[#07C5BA] focus:outline-none focus:ring-1 focus:ring-[#07C5BA]/40 disabled:bg-[#F5F5F5]"
        />

        {open && !disabled && !loading && (
          <ul
            id={listId}
            className="absolute z-20 mt-1 max-h-44 w-full overflow-y-auto rounded-lg border border-[#E8E8E8] bg-white py-1 shadow-lg"
          >
            {options.length === 0 ? (
              <li className="px-3 py-2 text-xs text-[#717171]">
                {query.trim() ? "Tidak ada hasil" : "Semua tim sudah dipilih"}
              </li>
            ) : (
              options.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-xs text-[#014547] hover:bg-[#F5F5F5]"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      addUser(u.id);
                      setOpen(true);
                    }}
                  >
                    <span className="font-medium">{u.display_name}</span>
                    <span className="text-[#717171]"> @{u.username}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      <p className="text-[10px] text-[#717171]">
        Ketik untuk mencari, klik untuk menambah. Enter = pilih pertama.
      </p>
    </div>
  );
}
