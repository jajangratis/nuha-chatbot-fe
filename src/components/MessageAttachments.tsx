"use client";

import { useState } from "react";
import { ChatAttachmentImage } from "@/components/ChatAttachmentImage";
import {
  fetchChatAttachmentBlob,
  formatFileSize,
  getAttachmentsFromMessage,
  type MessageAttachment,
} from "@/lib/chat-attachments";

type Props = {
  metadata: unknown;
  variant?: "light" | "dark";
  guestToken?: string | null;
};

function FileAttachmentLink({
  att,
  variant,
  guestToken,
}: {
  att: MessageAttachment;
  variant: "light" | "dark";
  guestToken?: string | null;
}) {
  const [loading, setLoading] = useState(false);

  const onOpen = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const blob = await fetchChatAttachmentBlob(att.id, { guestToken });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      window.alert(`Gagal membuka file: ${att.filename}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={(e) => void onOpen(e)}
      disabled={loading}
      className={`mt-1.5 flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-[11px] hover:opacity-90 disabled:opacity-60 ${
        variant === "dark"
          ? "border-white/25 bg-white/10 text-white"
          : "border-[#E8E8E8] bg-[#FAFAFA] text-[#014547]"
      }`}
    >
      <span aria-hidden>📎</span>
      <span className="min-w-0 flex-1 truncate">{att.filename}</span>
      <span className="shrink-0 opacity-70">
        {loading ? "…" : formatFileSize(att.size_bytes)}
      </span>
    </button>
  );
}

function AttachmentItem({
  att,
  variant,
  guestToken,
}: {
  att: MessageAttachment;
  variant: "light" | "dark";
  guestToken?: string | null;
}) {
  const isImage = att.mime_type.startsWith("image/");

  if (isImage) {
    return (
      <ChatAttachmentImage
        attachmentId={att.id}
        alt={att.filename}
        variant={variant}
        guestToken={guestToken}
      />
    );
  }

  return <FileAttachmentLink att={att} variant={variant} guestToken={guestToken} />;
}

export function MessageAttachments({ metadata, variant = "light", guestToken }: Props) {
  const attachments = getAttachmentsFromMessage(metadata);
  if (!attachments.length) return null;

  return (
    <div className="mt-1 space-y-1">
      {attachments.map((att) => (
        <AttachmentItem key={att.id} att={att} variant={variant} guestToken={guestToken} />
      ))}
    </div>
  );
}
