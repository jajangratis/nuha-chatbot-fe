"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
  type Ref,
} from "react";
import { createPortal } from "react-dom";
import type { AssignableUser } from "@/lib/tickets-api";
import {
  getMentionEditorCursor,
  renderMentionEditorContent,
  serializeMentionEditor,
  setMentionEditorCursor,
} from "@/lib/mention-editor";
import {
  buildMentionToken,
  filterMentionUsers,
  getMentionContext,
  hasMentionTokens,
  insertMentionToken,
  mentionUserLabel,
} from "@/lib/ticket-mentions";

export type MentionEditorElement = HTMLDivElement;

type Props = {
  value: string;
  onChange: (value: string) => void;
  users: AssignableUser[];
  placeholder?: string;
  rows?: number;
  className?: string;
  disabled?: boolean;
  onPaste?: (e: ClipboardEvent<MentionEditorElement>) => void;
  /** @deprecated gunakan editorRef */
  textareaRef?: Ref<MentionEditorElement | null>;
  editorRef?: Ref<MentionEditorElement | null>;
  segmentId?: string;
  usePortalMenu?: boolean;
};

export function MentionTextarea({
  value,
  onChange,
  users,
  placeholder,
  rows = 3,
  className = "",
  disabled = false,
  onPaste,
  textareaRef,
  editorRef,
  segmentId,
  usePortalMenu = false,
}: Props) {
  const innerRef = useRef<MentionEditorElement>(null);
  const syncingRef = useRef(false);
  const [menuPos, setMenuPos] = useState<{ left: number; top: number; width: number } | null>(
    null,
  );

  const refProp = editorRef ?? textareaRef;

  const setRefs = useCallback(
    (el: MentionEditorElement | null) => {
      innerRef.current = el;
      if (typeof refProp === "function") {
        refProp(el);
      } else if (refProp && "current" in refProp) {
        refProp.current = el;
      }
    },
    [refProp],
  );
  const listRef = useRef<HTMLUListElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mentionStart, setMentionStart] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const options = useMemo(
    () => filterMentionUsers(users, query),
    [users, query],
  );

  const minHeightStyle = { minHeight: `${Math.max(rows, 2) * 1.5}rem` };

  const updateMenuPosition = useCallback(() => {
    const el = innerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMenuPos({
      left: rect.left,
      top: rect.bottom + 4,
      width: Math.max(rect.width, 220),
    });
  }, []);

  const syncMentionState = useCallback(() => {
    const el = innerRef.current;
    if (!el || !users.length) {
      setOpen(false);
      setMenuPos(null);
      return;
    }
    const serialized = serializeMentionEditor(el);
    const cursor = getMentionEditorCursor(el);
    const ctx = getMentionContext(serialized, cursor);
    if (!ctx) {
      setOpen(false);
      setMenuPos(null);
      return;
    }
    setOpen(true);
    setQuery(ctx.query);
    setMentionStart(ctx.start);
    setActiveIndex(0);
    if (usePortalMenu) updateMenuPosition();
  }, [updateMenuPosition, usePortalMenu, users.length]);

  useEffect(() => {
    const el = innerRef.current;
    if (!el || syncingRef.current) return;
    const current = serializeMentionEditor(el);
    const domHasChips = Boolean(el.querySelector("[data-mention-id]"));
    if (current === value && (!hasMentionTokens(value) || domHasChips)) return;
    syncingRef.current = true;
    renderMentionEditorContent(el, value);
    syncingRef.current = false;
  }, [value]);

  useEffect(() => {
    if (!open || !usePortalMenu) return;
    updateMenuPosition();
    const onReposition = () => updateMenuPosition();
    window.addEventListener("scroll", onReposition, true);
    window.addEventListener("resize", onReposition);
    return () => {
      window.removeEventListener("scroll", onReposition, true);
      window.removeEventListener("resize", onReposition);
    };
  }, [open, updateMenuPosition, usePortalMenu]);

  useEffect(() => {
    if (!open) return;
    const item = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const emitChange = useCallback(
    (el: MentionEditorElement) => {
      let serialized = serializeMentionEditor(el);
      if (hasMentionTokens(serialized)) {
        const cursor = getMentionEditorCursor(el);
        renderMentionEditorContent(el, serialized);
        setMentionEditorCursor(el, cursor);
        serialized = serializeMentionEditor(el);
      }
      syncingRef.current = true;
      onChange(serialized);
      syncingRef.current = false;
      return serialized;
    },
    [onChange],
  );

  const pickUser = useCallback(
    (user: AssignableUser) => {
      const el = innerRef.current;
      if (!el) return;

      const serialized = serializeMentionEditor(el);
      const cursor = getMentionEditorCursor(el);
      const token = buildMentionToken(user);
      const { text, cursor: nextCursor } = insertMentionToken(
        serialized,
        mentionStart,
        cursor,
        token,
      );

      syncingRef.current = true;
      renderMentionEditorContent(el, text);
      setMentionEditorCursor(el, nextCursor);
      onChange(text);
      syncingRef.current = false;

      setOpen(false);
      setMenuPos(null);
      requestAnimationFrame(() => el.focus());
    },
    [mentionStart, onChange],
  );

  const onKeyDown = (e: KeyboardEvent<MentionEditorElement>) => {
    if (!open || !options.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % options.length);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + options.length) % options.length);
      return;
    }
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      pickUser(options[activeIndex]);
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  const menuListClass =
    "max-h-44 overflow-y-auto rounded-lg border border-[#E0F7F5] bg-white py-1 shadow-lg ring-1 ring-[#07C5BA]/10";

  const menuContent =
    open && options.length > 0 ? (
      <ul ref={listRef} className={menuListClass} role="listbox">
        {options.map((user, index) => (
          <li key={user.id} role="option" aria-selected={index === activeIndex}>
            <button
              type="button"
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition ${
                index === activeIndex
                  ? "bg-[#E8F9F8] text-[#014547]"
                  : "text-[#0B1D15] hover:bg-[#F4FAFA]"
              }`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pickUser(user)}
            >
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#639B15] to-[#07C5BA] text-[10px] font-bold text-white">
                {user.display_name.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 truncate font-medium">{mentionUserLabel(user)}</span>
            </button>
          </li>
        ))}
      </ul>
    ) : open && users.length > 0 && options.length === 0 ? (
      <div className="rounded-lg border border-[#E0F7F5] bg-white px-3 py-2 text-xs text-[#5A7A78] shadow-lg">
        Tidak ada staff cocok “{query}”
      </div>
    ) : null;

  const showPlaceholder = !value.trim();

  return (
    <div className="relative">
      {showPlaceholder && placeholder && (
        <div
          className={`pointer-events-none absolute inset-0 overflow-hidden text-[#9E9E9E] ${className}`}
          style={minHeightStyle}
          aria-hidden
        >
          {placeholder}
        </div>
      )}
      <div
        ref={setRefs}
        role="textbox"
        aria-multiline="true"
        contentEditable={!disabled}
        suppressContentEditableWarning
        data-segment-id={segmentId}
        style={minHeightStyle}
        onInput={(e) => {
          const el = e.currentTarget;
          emitChange(el);
          requestAnimationFrame(syncMentionState);
        }}
        onClick={syncMentionState}
        onKeyUp={syncMentionState}
        onKeyDown={onKeyDown}
        onBlur={() => {
          window.setTimeout(() => {
            setOpen(false);
            setMenuPos(null);
          }, 120);
        }}
        onPaste={onPaste}
        className={`whitespace-pre-wrap break-words outline-none ${className}`}
      />

      {!usePortalMenu && menuContent && (
        <div className="absolute bottom-full left-0 z-20 mb-1 w-full">{menuContent}</div>
      )}

      {usePortalMenu &&
        menuContent &&
        menuPos &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="z-[9999]"
            style={{
              position: "fixed",
              left: menuPos.left,
              top: menuPos.top,
              width: menuPos.width,
            }}
          >
            {menuContent}
          </div>,
          document.body,
        )}
    </div>
  );
}
