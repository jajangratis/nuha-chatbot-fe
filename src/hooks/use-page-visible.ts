"use client";

import { useEffect, useState } from "react";

/** Tab/jendela browser sedang terlihat (hentikan polling di background). */
export function usePageVisible() {
  const [visible, setVisible] = useState(
    () => typeof document === "undefined" || !document.hidden,
  );

  useEffect(() => {
    const onChange = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  return visible;
}

/** Interval polling chat: cepat saat antrian/human, lebih jarang saat hanya AI. */
export function chatPollIntervalMs(sessionStatus: string) {
  if (
    ["waiting_human", "handover_pending", "active_human"].includes(sessionStatus)
  ) {
    return 5_000;
  }
  return 20_000;
}
