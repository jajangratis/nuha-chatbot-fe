"use client";

import { FormEvent, useRef, useState } from "react";
import { CHAT_ACCEPT_FILES, CHAT_MAX_FILES, formatFileSize } from "@/lib/chat-attachments";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string, files: File[]) => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
  compact?: boolean;
  className?: string;
};

export function ChatComposer({
  value,
  onChange,
  onSend,
  disabled = false,
  loading = false,
  placeholder = "Ketik pesan...",
  compact = false,
  className = "",
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const addFiles = (list: FileList | null) => {
    if (!list?.length) return;
    setPendingFiles((prev) => {
      const merged = [...prev];
      for (const file of Array.from(list)) {
        if (merged.length >= CHAT_MAX_FILES) break;
        if (!merged.some((f) => f.name === file.name && f.size === file.size)) {
          merged.push(file);
        }
      }
      return merged.slice(0, CHAT_MAX_FILES);
    });
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const canSend = !disabled && !loading && (value.trim() || pendingFiles.length > 0);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    const files = [...pendingFiles];
    const text = value.trim();
    setPendingFiles([]);
    onChange("");
    void Promise.resolve(onSend(text, files));
  };

  return (
    <div
      className={
        className ||
        (compact ? "" : "border-t border-[#E8E8E8] bg-white px-3 py-2")
      }
    >
      {pendingFiles.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-1.5">
          {pendingFiles.map((file, i) => (
            <li
              key={`${file.name}-${file.size}-${i}`}
              className="flex items-center gap-1 rounded-full bg-[#F0F0F0] px-2 py-0.5 text-[10px] text-[#014547]"
            >
              <span className="max-w-[120px] truncate">{file.name}</span>
              <span className="text-[#717171]">({formatFileSize(file.size)})</span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="ml-0.5 text-[#717171] hover:text-red-600"
                aria-label="Hapus lampiran"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={fileRef}
          type="file"
          multiple
          accept={CHAT_ACCEPT_FILES}
          className="hidden"
          disabled={disabled || loading}
          onChange={(e) => addFiles(e.target.files)}
        />
        <button
          type="button"
          disabled={disabled || loading || pendingFiles.length >= CHAT_MAX_FILES}
          onClick={() => fileRef.current?.click()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E0E0E0] text-[#014547] hover:bg-[#F5F5F5] disabled:opacity-50"
          aria-label="Lampirkan file"
          title={`Lampirkan file (maks. ${CHAT_MAX_FILES})`}
        >
          <AttachIcon />
        </button>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled || loading}
          className="min-w-0 flex-1 rounded-full border border-[#E0E0E0] px-4 py-2 text-sm text-[#014547] outline-none focus:border-[#07C5BA] disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!canSend}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#639B15] to-[#AAE053] text-white disabled:opacity-50"
          aria-label="Kirim"
        >
          {loading ? (
            <span className="text-xs">…</span>
          ) : (
            <SendIcon />
          )}
        </button>
      </form>
      <p className="mt-1 text-[10px] text-[#9E9E9E]">
        PDF, gambar, Word/Excel — maks. 10 MB, {CHAT_MAX_FILES} file
      </p>
    </div>
  );
}

function AttachIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M16.5 6v11.5a4 4 0 01-8 0V5a2.5 2.5 0 015 0v10.5a1 1 0 01-2 0V6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor" />
    </svg>
  );
}
