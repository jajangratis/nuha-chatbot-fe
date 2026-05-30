"use client";

import { useEffect, useState } from "react";
import { fetchChatAttachmentBlob } from "@/lib/chat-attachments";

type Props = {
  attachmentId: string;
  alt: string;
  variant?: "light" | "dark";
  guestToken?: string | null;
  className?: string;
};

export function ChatAttachmentImage({
  attachmentId,
  alt,
  variant = "light",
  guestToken,
  className,
}: Props) {
  const [displaySrc, setDisplaySrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    const load = async () => {
      try {
        const blob = await fetchChatAttachmentBlob(attachmentId, { guestToken });
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setDisplaySrc(objectUrl);
        setFailed(false);
      } catch {
        if (!cancelled) setFailed(true);
      }
    };

    setDisplaySrc(null);
    setFailed(false);
    void load();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachmentId, guestToken]);

  if (failed) {
    return (
      <p
        className={`mt-1.5 rounded-lg border px-2 py-1.5 text-[11px] ${
          variant === "dark"
            ? "border-white/25 bg-white/10 text-white/90"
            : "border-amber-200 bg-amber-50 text-amber-900"
        }`}
      >
        Gambar tidak dapat dimuat{alt ? `: ${alt}` : ""}
      </p>
    );
  }

  if (!displaySrc) {
    return (
      <div
        className={`mt-1.5 flex h-20 max-w-full items-center justify-center rounded-lg border border-dashed text-[10px] ${
          variant === "dark"
            ? "border-white/30 text-white/70"
            : "border-[#E8E8E8] text-[#717171]"
        }`}
      >
        Memuat gambar…
      </div>
    );
  }

  return (
    <a
      href={displaySrc}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1.5 block max-w-full"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={displaySrc}
        alt={alt}
        className={
          className ??
          "max-h-48 max-w-full rounded-lg border border-[#E8E8E8] object-contain"
        }
      />
    </a>
  );
}
