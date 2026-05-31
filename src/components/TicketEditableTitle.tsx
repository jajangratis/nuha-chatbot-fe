"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  value: string;
  editable: boolean;
  ticketNumber?: string;
  onSave: (title: string) => Promise<void>;
  theme?: "onLight" | "onDark";
};

export function TicketEditableTitle({
  value,
  editable,
  ticketNumber,
  onSave,
  theme = "onLight",
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [editing]);

  const commit = useCallback(async () => {
    const next = draft.trim();
    if (!next) {
      setDraft(value);
      setEditing(false);
      return;
    }
    if (next === value.trim()) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(next);
      setEditing(false);
    } catch {
      setDraft(value);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }, [draft, value, onSave]);

  const cancel = useCallback(() => {
    setDraft(value);
    setEditing(false);
  }, [value]);

  const onDark = theme === "onDark";
  const numberClass = onDark
    ? "text-xs font-medium tracking-wide text-white/65"
    : "text-xs font-medium tracking-wide text-[#7C828D]";
  const titleClass = onDark
    ? "mt-0.5 text-2xl font-semibold leading-snug text-white"
    : "mt-0.5 text-2xl font-semibold leading-snug text-[#1E1F21]";
  const hintClass = onDark ? "text-[10px] text-white/55" : "text-[10px] text-[#7C828D]";
  const editButtonClass = onDark
    ? "mt-0.5 flex w-full min-w-0 items-start gap-2 rounded-lg border border-transparent px-2 py-1.5 text-left transition hover:border-white/20 hover:bg-white/10 group-hover:border-white/20"
    : "mt-0.5 flex w-full min-w-0 items-start gap-2 rounded-lg border border-transparent px-2 py-1.5 text-left transition hover:border-[#E8E8E8] hover:bg-[#F7F8F9] group-hover:border-[#E8E8E8]";
  const pencilClass = onDark
    ? "mt-2 shrink-0 rounded-md p-1 text-white/70 opacity-0 transition group-hover:opacity-100"
    : "mt-2 shrink-0 rounded-md p-1 text-[#7C828D] opacity-0 transition group-hover:opacity-100";
  const inputClass = onDark
    ? "w-full resize-none overflow-hidden rounded-lg border-2 border-[#07C5BA]/50 bg-white px-3 py-2 text-2xl font-semibold leading-snug text-[#0B1D15] shadow-sm outline-none ring-0 focus:border-[#07C5BA]"
    : "w-full resize-none overflow-hidden rounded-lg border-2 border-[#07C5BA]/40 bg-white px-3 py-2 text-2xl font-semibold leading-snug text-[#1E1F21] shadow-sm outline-none ring-0 focus:border-[#07C5BA]";

  if (!editable) {
    return (
      <div className="min-w-0">
        {ticketNumber && (
          <p className={numberClass}>{ticketNumber}</p>
        )}
        <h1 className={titleClass}>{value}</h1>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="min-w-0">
        {ticketNumber && (
          <p className={numberClass}>{ticketNumber}</p>
        )}
        <div className="relative mt-1">
          <textarea
            ref={inputRef}
            value={draft}
            rows={1}
            disabled={saving}
            onChange={(e) => {
              setDraft(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void commit();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                cancel();
              }
            }}
            onBlur={() => void commit()}
            className={inputClass}
            aria-label="Judul tiket"
          />
          <p className={`mt-1 ${hintClass}`}>
            Enter simpan · Esc batal{saving ? " · Menyimpan…" : ""}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="group min-w-0">
      {ticketNumber && (
        <p className={numberClass}>{ticketNumber}</p>
      )}
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={editButtonClass}
        title="Klik untuk mengubah judul"
      >
        <h1 className={`min-w-0 flex-1 ${titleClass.replace("mt-0.5 ", "")}`}>
          {value}
        </h1>
        <span className={pencilClass} aria-hidden>
          <PencilIcon />
        </span>
      </button>
    </div>
  );
}

function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 20h4l10.5-10.5a2.12 2.12 0 00-3-3L5 17v3zM14.5 6.5l3 3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
