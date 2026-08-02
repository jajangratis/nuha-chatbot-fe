"use client";

import {
  lastAssistantMessageId,
  shouldShowEscalateOffer,
} from "@/components/AssistantEscalateOffer";

type MessageLike = { id: string; role: string; content: string; answerMode?: string };

type Props = {
  messages: MessageLike[];
  assistantMessageId: string;
  onEscalate: () => void;
  onGeneralSearch: (query: string) => void;
  escalating?: boolean;
  generalLoading?: boolean;
  disabled?: boolean;
};

export function getAssistantAnswerMode(metadata: unknown): string | undefined {
  if (!metadata || typeof metadata !== "object") return undefined;
  const mode = (metadata as { answerMode?: string }).answerMode;
  return typeof mode === "string" ? mode : undefined;
}

/** Pertanyaan user tepat sebelum balasan asisten ini. */
export function lastUserQueryBeforeAssistant(
  messages: MessageLike[],
  assistantMessageId: string,
): string | null {
  const idx = messages.findIndex((m) => m.id === assistantMessageId);
  if (idx < 0) return null;
  for (let i = idx - 1; i >= 0; i--) {
    if (messages[i].role === "user" && messages[i].content.trim()) {
      return messages[i].content.trim();
    }
  }
  return null;
}

export function shouldShowFallbackOffer(
  messages: MessageLike[],
  assistantMessageId: string,
  answerMode?: string,
): boolean {
  if (answerMode !== "out_of_scope") return false;
  if (!shouldShowEscalateOffer(messages, assistantMessageId)) return false;
  return lastAssistantMessageId(messages) === assistantMessageId;
}

export function AssistantFallbackOffer({
  messages,
  assistantMessageId,
  onEscalate,
  onGeneralSearch,
  escalating = false,
  generalLoading = false,
  disabled = false,
}: Props) {
  const query = lastUserQueryBeforeAssistant(messages, assistantMessageId);
  const busy = escalating || generalLoading;

  return (
    <div className="mt-3 border-t border-[#E8E8E8] pt-2.5">
      <p className="text-[10px] leading-snug text-[#717171]">
        Topik ini tidak ada di Pusat Bantuan Nuha. Anda bisa menghubungi implementator
        atau mencari jawaban umum di internet.
      </p>
      <div className="mt-2 flex flex-col gap-2">
        <button
          type="button"
          disabled={disabled || busy}
          onClick={onEscalate}
          className="w-full rounded-lg border border-[#014547] bg-[#014547]/5 py-2 text-xs font-medium text-[#014547] transition hover:bg-[#014547]/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {escalating ? "Memasukkan antrian…" : "Hubungi IT Implementator"}
        </button>
        <button
          type="button"
          disabled={disabled || busy || !query}
          onClick={() => query && onGeneralSearch(query)}
          className="w-full rounded-lg border border-[#AAE053] bg-[#AAE053]/10 py-2 text-xs font-medium text-[#3d5c0a] transition hover:bg-[#AAE053]/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {generalLoading ? "Mencari di internet…" : "Tanya umum (cari di internet)"}
        </button>
      </div>
    </div>
  );
}

/** Label untuk balasan dari pencarian web umum. */
export function GeneralWebAnswerBadge() {
  return (
    <p className="mb-2 text-[10px] font-medium text-[#717171]">
      Jawaban umum · dari internet · bukan panduan resmi Nuha
    </p>
  );
}
