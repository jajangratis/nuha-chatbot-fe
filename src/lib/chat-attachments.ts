import { loadAuthToken } from "@/lib/auth-api";
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

export function chatAttachmentApiPath(attachmentId: string) {
  return withBasePath(`/api/v1/attachments/${attachmentId}`);
}

/** Ambil blob lampiran chat (butuh login atau token guest). */
export async function fetchChatAttachmentBlob(
  attachmentId: string,
  opts?: { guestToken?: string | null },
) {
  const headers = new Headers();
  const token = loadAuthToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  } else if (opts?.guestToken) {
    headers.set("X-Guest-Session-Token", opts.guestToken);
  } else {
    throw new Error("Tidak terautentikasi untuk membuka lampiran.");
  }

  const res = await fetch(chatAttachmentApiPath(attachmentId), {
    headers,
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Lampiran gagal dimuat (${res.status})`);
  }
  return res.blob();
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const CHAT_ACCEPT_FILES =
  "image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain,.doc,.docx,.xls,.xlsx";

export const CHAT_MAX_FILES = 3;
