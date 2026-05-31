"use client";

import { FormEvent, useState } from "react";

const CLAMP_LINES = 5;
const LONG_BODY_CHARS = 220;

type Comment = {
  id: string;
  body: string;
  author_name: string;
  created_at: string;
};

type Props = {
  comments: Comment[];
  commentText: string;
  onCommentTextChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  expanded: boolean;
  onToggleExpanded: () => void;
  className?: string;
};

function CommentBody({ body }: { body: string }) {
  const [open, setOpen] = useState(false);
  const isLong =
    body.length > LONG_BODY_CHARS || body.split("\n").length > CLAMP_LINES;

  if (!isLong || open) {
    return (
      <div>
        <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed text-[#333]">
          {body}
        </p>
        {isLong && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-1 text-[10px] font-medium text-[#07C5BA] hover:underline"
          >
            Ringkas
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <p className="mt-0.5 line-clamp-5 whitespace-pre-wrap text-sm leading-relaxed text-[#333]">
        {body}
      </p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1 text-[10px] font-medium text-[#07C5BA] hover:underline"
      >
        Baca selengkapnya
      </button>
    </div>
  );
}

export function TicketInternalCommentsPanel({
  comments,
  commentText,
  onCommentTextChange,
  onSubmit,
  expanded,
  onToggleExpanded,
  className = "",
}: Props) {
  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#E8E8E8] bg-white p-3 shadow-sm ${className}`}
    >
      <div className="mb-2 flex shrink-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#7C828D]">
            Komentar internal
          </h2>
          <p className="mt-0.5 text-[10px] text-[#717171]">
            Hanya terlihat oleh tim staff, tidak dikirim ke user RS.
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleExpanded}
          className="shrink-0 rounded border border-[#E8E8E8] px-2 py-0.5 text-[10px] font-medium text-[#014547] hover:bg-[#F7F8F9]"
          title={expanded ? "Perkecil panel komentar" : "Perluas panel komentar"}
        >
          {expanded ? "Kecilkan" : "Perluas"}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-0.5">
        <ul className="space-y-2">
          {comments.map((c) => (
            <li
              key={c.id}
              className="rounded-lg border border-[#F0F0F0] bg-[#FAFAFA] px-2.5 py-2"
            >
              <p className="text-[10px] text-[#717171]">
                {c.author_name} · {new Date(c.created_at).toLocaleString("id-ID")}
              </p>
              <CommentBody body={c.body} />
            </li>
          ))}
          {comments.length === 0 && (
            <li className="text-xs text-[#717171]">Belum ada komentar internal</li>
          )}
        </ul>
      </div>

      <form
        onSubmit={onSubmit}
        className="mt-2 flex shrink-0 flex-col gap-1.5 border-t border-[#F0F0F0] pt-2"
      >
        <textarea
          value={commentText}
          onChange={(e) => onCommentTextChange(e.target.value)}
          rows={2}
          className="w-full rounded-lg border px-2.5 py-1.5 text-sm"
          placeholder="Catatan internal untuk tim…"
        />
        <button
          type="submit"
          disabled={!commentText.trim()}
          className="self-end rounded-lg bg-[#014547] px-3 py-1.5 text-xs text-white disabled:opacity-50"
        >
          Kirim komentar internal
        </button>
      </form>
    </section>
  );
}
