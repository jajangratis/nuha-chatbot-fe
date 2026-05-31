"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatMarkdown } from "@/components/ChatMarkdown";
import { patchTicket, uploadTicketDescriptionImage } from "@/lib/tickets-api";
import { MarkdownImage } from "@/components/MarkdownImage";

const CODE_BLOCK = "```text\n\n```";
const IMAGE_ACCEPT = "image/jpeg,image/png,image/gif,image/webp";
const IMAGE_MD_RE = /!\[([^\]]*)\]\(([^)]+)\)/g;

type Props = {
  ticketId: string;
  value: string;
  editable: boolean;
  onSaved: (description: string) => void;
  onError: (message: string) => void;
};

type TextSegment = { type: "text"; id: string; content: string };
type ImageSegment = { type: "image"; id: string; alt: string; src: string; raw: string };
type Segment = TextSegment | ImageSegment;

function insertAtCursor(
  text: string,
  cursor: number,
  insert: string,
  replaceLength = 0,
) {
  const start = cursor - replaceLength;
  const next = text.slice(0, start) + insert + text.slice(cursor);
  return { text: next, cursor: start + insert.length };
}

function applyCodeSlashCommand(text: string, cursor: number) {
  const before = text.slice(0, cursor);
  if (!/\/code$/.test(before)) return null;
  return insertAtCursor(text, cursor, CODE_BLOCK, 5);
}

function markdownImageSnippet(url: string, alt: string) {
  const safeAlt = alt.replace(/[\]]/g, "");
  return `![${safeAlt}](${url})`;
}

function parseSegments(markdown: string): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;
  let idx = 0;
  const re = new RegExp(IMAGE_MD_RE.source, "g");
  let m: RegExpExecArray | null;

  while ((m = re.exec(markdown)) !== null) {
    if (m.index > lastIndex) {
      segments.push({
        type: "text",
        id: `t-${idx++}`,
        content: markdown.slice(lastIndex, m.index),
      });
    }
    segments.push({
      type: "image",
      id: `i-${idx++}`,
      alt: m[1],
      src: m[2],
      raw: m[0],
    });
    lastIndex = m.index + m[0].length;
  }

  if (lastIndex < markdown.length) {
    segments.push({
      type: "text",
      id: `t-${idx++}`,
      content: markdown.slice(lastIndex),
    });
  }

  if (!segments.length) {
    segments.push({ type: "text", id: "t-0", content: markdown });
  }

  return segments;
}

function segmentsToDraft(segments: Segment[]) {
  return segments
    .map((s) => (s.type === "text" ? s.content : s.raw))
    .join("");
}

function hasImageSegments(segments: Segment[]) {
  return segments.some((s) => s.type === "image");
}

export function TicketDescriptionEditor({
  ticketId,
  value,
  editable,
  onSaved,
  onError,
}: Props) {
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const mainTextRef = useRef<HTMLTextAreaElement>(null);
  const segmentTextRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const segments = useMemo(() => parseSegments(draft), [draft]);
  const inlineImages = hasImageSegments(segments);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const getActiveTextarea = () => {
    const active = document.activeElement;
    if (active instanceof HTMLTextAreaElement) {
      const segId = active.dataset.segmentId;
      if (segId) return { el: active, segmentId: segId };
    }
    if (mainTextRef.current) {
      return { el: mainTextRef.current, segmentId: null };
    }
    const textSegs = segments.filter((s): s is TextSegment => s.type === "text");
    const last = textSegs[textSegs.length - 1];
    if (last) {
      const el = segmentTextRefs.current[last.id];
      if (el) return { el, segmentId: last.id };
    }
    return null;
  };

  const setCursorOn = (el: HTMLTextAreaElement, pos: number) => {
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  };

  const insertMarkdown = useCallback(
    (snippet: string, replaceLength = 0) => {
      const active = getActiveTextarea();
      if (!active) {
        setDraft((d) => d + snippet);
        return;
      }

      const { el, segmentId } = active;
      const cursor = el.selectionStart ?? 0;
      let source = draft;
      if (segmentId) {
        const seg = segments.find((s) => s.id === segmentId);
        if (seg?.type === "text") source = seg.content;
      }

      const { text: nextText, cursor: nextCursor } = insertAtCursor(
        source,
        cursor,
        snippet,
        replaceLength,
      );

      if (segmentId) {
        const nextSegs = segments.map((s) =>
          s.id === segmentId && s.type === "text" ? { ...s, content: nextText } : s,
        );
        setDraft(segmentsToDraft(nextSegs));
      } else {
        setDraft(nextText);
      }
      setCursorOn(el, nextCursor);
    },
    [draft, segments],
  );

  const updateTextSegment = (segmentId: string, content: string, cursor: number) => {
    const codeCmd = applyCodeSlashCommand(content, cursor);
    const nextContent = codeCmd ? codeCmd.text : content;
    const nextSegs = segments.map((s) =>
      s.id === segmentId && s.type === "text" ? { ...s, content: nextContent } : s,
    );
    setDraft(segmentsToDraft(nextSegs));
    if (codeCmd) {
      const el = segmentTextRefs.current[segmentId];
      if (el) setCursorOn(el, codeCmd.cursor);
    }
  };

  const handleMainTextChange = (text: string) => {
    const el = mainTextRef.current;
    const cursor = el?.selectionStart ?? text.length;
    const codeCmd = applyCodeSlashCommand(text, cursor);
    if (codeCmd) {
      setDraft(codeCmd.text);
      if (el) setCursorOn(el, codeCmd.cursor);
      return;
    }
    setDraft(text);
  };

  const removeImageSegment = (segmentId: string) => {
    setDraft((d) =>
      segmentsToDraft(parseSegments(d).filter((s) => s.id !== segmentId)),
    );
  };

  const uploadImageFile = async (file: File) => {
    setUploading(true);
    try {
      const { attachment } = await uploadTicketDescriptionImage(ticketId, file);
      insertMarkdown(`\n${markdownImageSnippet(attachment.url, file.name)}\n`);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Upload gambar gagal");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadImageFile(file);
  };

  const onPaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) await uploadImageFile(file);
        return;
      }
    }
  };

  const onInsertCode = () => {
    insertMarkdown(`\n${CODE_BLOCK}\n`);
    const active = getActiveTextarea();
    if (active?.el) {
      const pos = (active.el.selectionStart ?? 0) - 4;
      setCursorOn(active.el, Math.max(0, pos));
    }
  };

  const onSave = async () => {
    setSaving(true);
    try {
      await patchTicket(ticketId, { description: draft });
      onSaved(draft);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Gagal menyimpan deskripsi");
    } finally {
      setSaving(false);
    }
  };

  const editorBoxClass =
    "min-h-32 max-h-80 overflow-y-auto rounded-lg border border-[#E8E8E8] bg-white px-3 py-2 focus-within:border-[#07C5BA] focus-within:ring-1 focus-within:ring-[#07C5BA]/30";

  const textAreaClass =
    "block w-full resize-none border-0 bg-transparent p-0 font-mono text-sm leading-relaxed text-[#333] outline-none focus:ring-0";

  if (!editable) {
    if (!value?.trim()) return null;
    return (
      <div>
        <h3 className="mb-1 text-xs font-medium text-[#014547]">Deskripsi</h3>
        <ChatMarkdown content={value} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-medium text-[#014547]">Deskripsi</h3>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPreview((p) => !p)}
            className="rounded border border-[#E8E8E8] px-2 py-0.5 text-[10px] text-[#014547] hover:bg-[#F5F5F5]"
          >
            {preview ? "Edit" : "Pratinjau"}
          </button>
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="rounded border border-[#E8E8E8] px-2 py-0.5 text-[10px] text-[#014547] hover:bg-[#F5F5F5] disabled:opacity-50"
          >
            {uploading ? "Upload..." : "Gambar"}
          </button>
          <button
            type="button"
            onClick={onInsertCode}
            className="rounded border border-[#E8E8E8] px-2 py-0.5 text-[10px] text-[#014547] hover:bg-[#F5F5F5]"
            title="Sisipkan blok kode (atau ketik /code)"
          >
            /code
          </button>
          <button
            type="button"
            disabled={saving || draft === value}
            onClick={() => void onSave()}
            className="rounded bg-[#014547] px-2 py-0.5 text-[10px] text-white disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="hidden"
        onChange={(e) => void onPickImage(e)}
      />
      <p className="text-[10px] text-[#717171]">
        Markdown didukung. Ketik <kbd className="rounded bg-[#F5F5F5] px-1">/code</kbd> untuk
        blok kode. Gambar tampil inline di editor.
      </p>
      {preview ? (
        <div className={`${editorBoxClass} bg-[#FAFAFA]`}>
          {draft.trim() ? (
            <ChatMarkdown content={draft} />
          ) : (
            <p className="text-xs text-[#717171]">Belum ada deskripsi.</p>
          )}
        </div>
      ) : (
        <div className={editorBoxClass}>
          {inlineImages ? (
            <div className="space-y-2">
              {segments.map((seg) => {
                if (seg.type === "text") {
                  return (
                    <textarea
                      key={seg.id}
                      ref={(el) => {
                        segmentTextRefs.current[seg.id] = el;
                      }}
                      data-segment-id={seg.id}
                      value={seg.content}
                      onChange={(e) =>
                        updateTextSegment(
                          seg.id,
                          e.target.value,
                          e.target.selectionStart ?? 0,
                        )
                      }
                      onPaste={(e) => void onPaste(e)}
                      rows={Math.max(2, seg.content.split("\n").length)}
                      className={textAreaClass}
                      placeholder="Teks deskripsi…"
                    />
                  );
                }
                return (
                  <div
                    key={seg.id}
                    className="relative rounded-md border border-dashed border-[#E8E8E8] bg-[#FAFAFA] p-1"
                  >
                    <button
                      type="button"
                      onClick={() => removeImageSegment(seg.id)}
                      className="absolute right-1 top-1 z-10 rounded bg-white/90 px-1.5 py-0.5 text-[10px] text-[#717171] shadow hover:text-red-600"
                      title="Hapus gambar"
                    >
                      ✕
                    </button>
                    <MarkdownImage src={seg.src} alt={seg.alt} className="my-0 max-h-48" />
                  </div>
                );
              })}
            </div>
          ) : (
            <textarea
              ref={mainTextRef}
              value={draft}
              onChange={(e) => handleMainTextChange(e.target.value)}
              onPaste={(e) => void onPaste(e)}
              rows={8}
              className={`${textAreaClass} min-h-28`}
              placeholder="Jelaskan masalah… (/code untuk blok kode)"
            />
          )}
        </div>
      )}
    </div>
  );
}
