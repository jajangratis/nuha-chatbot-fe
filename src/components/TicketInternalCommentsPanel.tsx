"use client";

import { FormEvent, useState } from "react";
import {
  nuhaCommentCardClass,
  nuhaInputClass,
  nuhaInternalPanelClass,
  nuhaLinkClass,
  nuhaPanelBodyClass,
  nuhaPanelHeaderClass,
  nuhaPanelHintClass,
  nuhaPanelTitleClass,
  nuhaPrimaryButtonClass,
  nuhaSecondaryButtonClass,
} from "@/lib/nuha-support-theme";

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
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[#0B1D15]">
          {body}
        </p>
        {isLong && (
          <button type="button" onClick={() => setOpen(false)} className={`mt-1 ${nuhaLinkClass}`}>
            Ringkas
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <p className="mt-1 line-clamp-5 whitespace-pre-wrap text-sm leading-relaxed text-[#0B1D15]">
        {body}
      </p>
      <button type="button" onClick={() => setOpen(true)} className={`mt-1 ${nuhaLinkClass}`}>
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
    <section className={`${nuhaInternalPanelClass} min-h-0 ${className}`}>
      <div className={nuhaPanelHeaderClass}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#014547]/10 text-[#014547]"
                aria-hidden
              >
                <LockIcon />
              </span>
              <h2 className={nuhaPanelTitleClass}>Komentar internal</h2>
            </div>
            <p className={`mt-1 ${nuhaPanelHintClass}`}>
              Hanya terlihat oleh tim staff, tidak dikirim ke user RS.
            </p>
          </div>
          <button
            type="button"
            onClick={onToggleExpanded}
            className={nuhaSecondaryButtonClass}
            title={expanded ? "Perkecil panel komentar" : "Perluas panel komentar"}
          >
            {expanded ? "Kecilkan" : "Perluas"}
          </button>
        </div>
      </div>

      <div className={`${nuhaPanelBodyClass} bg-[#FAFCFC] px-3 py-2`}>
        <ul className="space-y-2">
          {comments.map((c) => (
            <li key={c.id} className={nuhaCommentCardClass}>
              <p className="text-[10px] font-medium text-[#014547]">
                {c.author_name}
                <span className="font-normal text-[#5A7A78]">
                  {" "}
                  · {new Date(c.created_at).toLocaleString("id-ID")}
                </span>
              </p>
              <CommentBody body={c.body} />
            </li>
          ))}
          {comments.length === 0 && (
            <li className={`py-2 text-center text-xs ${nuhaPanelHintClass}`}>
              Belum ada komentar internal
            </li>
          )}
        </ul>
      </div>

      <form
        onSubmit={onSubmit}
        className="flex shrink-0 flex-col gap-2 border-t border-[#E0F7F5] bg-white px-3 py-2.5"
      >
        <textarea
          value={commentText}
          onChange={(e) => onCommentTextChange(e.target.value)}
          rows={2}
          className={nuhaInputClass}
          placeholder="Catatan internal untuk tim…"
        />
        <button
          type="submit"
          disabled={!commentText.trim()}
          className={`self-end ${nuhaPrimaryButtonClass}`}
        >
          Kirim komentar internal
        </button>
      </form>
    </section>
  );
}

function LockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 10V8a5 5 0 0110 0v2M6 10h12v10H6V10z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
