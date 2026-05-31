import { useCallback, useLayoutEffect, useRef, type RefObject } from "react";

/** Ambang jarak dari bawah — di dalam ambang ini dianggap "menempel" ke bawah. */
export const CHAT_NEAR_BOTTOM_PX = 80;

export function isChatNearBottom(
  el: HTMLElement | null | undefined,
  threshold = CHAT_NEAR_BOTTOM_PX,
) {
  if (!el) return true;
  const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
  return distance <= threshold;
}

export function scrollChatToBottom(
  el: HTMLElement | null | undefined,
  { force = false, threshold = CHAT_NEAR_BOTTOM_PX }: { force?: boolean; threshold?: number } = {},
) {
  if (!el) return;
  if (force || isChatNearBottom(el, threshold)) {
    el.scrollTop = el.scrollHeight;
  }
}

export function scrollChatToBottomSoon(
  getEl: () => HTMLElement | null | undefined,
  options?: { force?: boolean; threshold?: number },
) {
  requestAnimationFrame(() => {
    scrollChatToBottom(getEl(), options);
  });
}

type ScrollSnapshot = { scrollTop: number; scrollHeight: number };

/**
 * Pin scroll ke bawah hanya saat user memang di bawah.
 * Saat user scroll ke atas, posisi dipertahankan walau daftar pesan di-refresh (polling).
 */
export function useChatScrollPin(
  listRef: RefObject<HTMLDivElement | null>,
  messageDep: unknown,
) {
  const pinnedRef = useRef(true);
  const snapshotRef = useRef<ScrollSnapshot>({ scrollTop: 0, scrollHeight: 0 });
  const forceNextRef = useRef(false);

  const onScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const pinned = isChatNearBottom(el);
    pinnedRef.current = pinned;
    if (!pinned) {
      snapshotRef.current = {
        scrollTop: el.scrollTop,
        scrollHeight: el.scrollHeight,
      };
    }
  }, [listRef]);

  const forceScrollNext = useCallback(() => {
    forceNextRef.current = true;
    pinnedRef.current = true;
  }, []);

  const applyScrollAfterMessagesChange = useCallback(() => {
    const el = listRef.current;
    if (!el) return;

    const force = forceNextRef.current;
    forceNextRef.current = false;

    if (force || pinnedRef.current) {
      el.scrollTop = el.scrollHeight;
      pinnedRef.current = true;
      snapshotRef.current = {
        scrollTop: el.scrollTop,
        scrollHeight: el.scrollHeight,
      };
      return;
    }

    const snap = snapshotRef.current;
    const delta = el.scrollHeight - snap.scrollHeight;
    el.scrollTop = snap.scrollTop + Math.max(0, delta);
    snapshotRef.current = {
      scrollTop: el.scrollTop,
      scrollHeight: el.scrollHeight,
    };
  }, [listRef]);

  useLayoutEffect(() => {
    applyScrollAfterMessagesChange();
  }, [messageDep, applyScrollAfterMessagesChange]);

  const scrollToBottom = useCallback(
    (force = false) => {
      if (force) forceNextRef.current = true;
      scrollChatToBottomSoon(() => listRef.current, {
        force: force || pinnedRef.current,
      });
    },
    [listRef],
  );

  return { onScroll, scrollToBottom, forceScrollNext };
}
