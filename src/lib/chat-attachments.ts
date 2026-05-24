import { withBasePath } from "@/lib/app-path";

export type MessageAttachment = {
  id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  url: string;
};

export function getAttachmentsFromMessage(metadata: unknown): MessageAttachment[] {
  if (!metadata || typeof metadata !== "object") return [];
  const att = (metadata as { attachments?: MessageAttachment[] }).attachments;
  return Array.isArray(att) ? att : [];
}

export function attachmentDownloadUrl(url: string) {
  return withBasePath(url);
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const CHAT_ACCEPT_FILES =
  "image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain,.doc,.docx,.xls,.xlsx";

export const CHAT_MAX_FILES = 3;
