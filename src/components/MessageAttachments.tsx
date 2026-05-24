import {
  attachmentDownloadUrl,
  formatFileSize,
  getAttachmentsFromMessage,
  type MessageAttachment,
} from "@/lib/chat-attachments";

type Props = {
  metadata: unknown;
  variant?: "light" | "dark";
};

function AttachmentItem({
  att,
  variant,
}: {
  att: MessageAttachment;
  variant: "light" | "dark";
}) {
  const isImage = att.mime_type.startsWith("image/");
  const href = attachmentDownloadUrl(att.url);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`mt-1.5 flex items-center gap-2 rounded-lg border px-2 py-1.5 text-[11px] hover:opacity-90 ${
        variant === "dark"
          ? "border-white/25 bg-white/10 text-white"
          : "border-[#E8E8E8] bg-[#FAFAFA] text-[#014547]"
      }`}
    >
      <span aria-hidden>{isImage ? "🖼" : "📎"}</span>
      <span className="min-w-0 flex-1 truncate">{att.filename}</span>
      <span className="shrink-0 opacity-70">{formatFileSize(att.size_bytes)}</span>
    </a>
  );
}

export function MessageAttachments({ metadata, variant = "light" }: Props) {
  const attachments = getAttachmentsFromMessage(metadata);
  if (!attachments.length) return null;

  return (
    <div className="mt-1 space-y-1">
      {attachments.map((att) => (
        <AttachmentItem key={att.id} att={att} variant={variant} />
      ))}
    </div>
  );
}
