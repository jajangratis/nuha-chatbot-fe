"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  value: string;
  editable: boolean;
  ticketNumber?: string;
  onSave: (title: string) => Promise<void>;
};

export function TicketEditableTitle({
  value,
  editable,
  ticketNumber,
  onSave,
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

  if (!editable) {
    return (
      <div className="min-w-0">
        {ticketNumber && (
          <p className="text-xs font-medium tracking-wide text-[#7C828D]">{ticketNumber}</p>
        )}
        <h1 className="mt-0.5 text-2xl font-semibold leading-snug text-[#1E1F21]">{value}</h1>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="min-w-0">
        {ticketNumber && (
          <p className="text-xs font-medium tracking-wide text-[#7C828D]">{ticketNumber}</p>
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
            className="w-full resize-none overflow-hidden rounded-lg border-2 border-[#7B68EE]/40 bg-white px-3 py-2 text-2xl font-semibold leading-snug text-[#1E1F21] shadow-sm outline-none ring-0 focus:border-[#7B68EE]"
            aria-label="Judul tiket"
          />
          <p className="mt-1 text-[10px] text-[#7C828D]">
            Enter simpan · Esc batal{saving ? " · Menyimpan…" : ""}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="group min-w-0">
      {ticketNumber && (
        <p className="text-xs font-medium tracking-wide text-[#7C828D]">{ticketNumber}</p>
      )}
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="mt-0.5 flex w-full min-w-0 items-start gap-2 rounded-lg border border-transparent px-2 py-1.5 text-left transition hover:border-[#E8E8E8] hover:bg-[#F7F8F9] group-hover:border-[#E8E8E8]"
        title="Klik untuk mengubah judul"
      >
        <h1 className="min-w-0 flex-1 text-2xl font-semibold leading-snug text-[#1E1F21]">
          {value}
        </h1>
        <span
          className="mt-2 shrink-0 rounded-md p-1 text-[#7C828D] opacity-0 transition group-hover:opacity-100"
          aria-hidden
        >
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
