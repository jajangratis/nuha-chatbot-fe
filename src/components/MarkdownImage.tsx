"use client";

import { useEffect, useState } from "react";
import { loadAuthToken } from "@/lib/auth-api";
import { getBasePath, withBasePath } from "@/lib/app-path";

function isTicketAttachmentUrl(src: string) {
  return /\/tickets\/attachments\/[0-9a-f-]{36}/i.test(src);
}

/** Normalisasi ke path BFF `/api/v1/tickets/attachments/:id` */
export function ticketAttachmentFetchPath(src: string) {
  const base = getBasePath();
  let path = src;
  if (base && path.startsWith(base)) {
    path = path.slice(base.length) || "/";
  }
  const match = path.match(/\/tickets\/attachments\/([0-9a-f-]{36})/i);
  if (match) {
    return withBasePath(`/api/v1/tickets/attachments/${match[1]}`);
  }
  if (path.startsWith("/api/")) {
    return withBasePath(path);
  }
  return withBasePath(path);
}

type Props = {
  src?: string;
  alt?: string;
  className?: string;
};

export function MarkdownImage({ src, alt, className }: Props) {
  const [displaySrc, setDisplaySrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!src) {
      setDisplaySrc(null);
      return;
    }

    if (!isTicketAttachmentUrl(src)) {
      setDisplaySrc(
        src.startsWith("http://") || src.startsWith("https://")
          ? src
          : src.startsWith("/api/")
            ? withBasePath(src)
            : src,
      );
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    const load = async () => {
      const token = loadAuthToken();
      if (!token) {
        setFailed(true);
        return;
      }
      try {
        const res = await fetch(ticketAttachmentFetchPath(src), {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!res.ok) throw new Error(String(res.status));
        const blob = await res.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setDisplaySrc(objectUrl);
        setFailed(false);
      } catch {
        if (!cancelled) setFailed(true);
      }
    };

    void load();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (failed) {
    return (
      <span
        role="alert"
        className={`my-2 block rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-900 ${className ?? ""}`}
      >
        Gambar tidak dapat dimuat{alt ? `: ${alt}` : ""}. Buka mode Pratinjau setelah
        login, atau simpan ulang deskripsi.
      </span>
    );
  }

  if (!displaySrc) {
    return (
      <span
        role="status"
        className={`my-2 flex h-24 w-full max-w-full items-center justify-center rounded-lg border border-dashed border-[#E8E8E8] bg-[#FAFAFA] text-xs text-[#717171] ${className ?? ""}`}
      >
        Memuat gambar…
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={displaySrc}
      alt={alt ?? ""}
      className={
        className ??
        "my-2 max-h-64 max-w-full rounded-lg border border-[#E8E8E8] object-contain"
      }
    />
  );
}
