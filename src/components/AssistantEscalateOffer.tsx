"use client";

type Props = {
  onEscalate: () => void;
  escalating?: boolean;
  disabled?: boolean;
};

/** Opsi eskalasi menempel di bawah balasan AI — bukan tombol terpisah di composer. */
export function AssistantEscalateOffer({
  onEscalate,
  escalating = false,
  disabled = false,
}: Props) {
  return (
    <div className="mt-3 border-t border-[#E8E8E8] pt-2.5">
      <p className="text-[10px] leading-snug text-[#717171]">
        Jawaban kurang membantu? Anda bisa menghubungi implementator IT untuk bantuan
        lebih lanjut.
      </p>
      <button
        type="button"
        disabled={disabled || escalating}
        onClick={onEscalate}
        className="mt-2 w-full rounded-lg border border-[#014547] bg-[#014547]/5 py-2 text-xs font-medium text-[#014547] transition hover:bg-[#014547]/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {escalating ? "Memasukkan antrian…" : "Hubungi IT Implementator"}
      </button>
    </div>
  );
}

/** ID pesan asisten terakhir (untuk menempelkan opsi eskalasi sekali saja). */
export function lastAssistantMessageId(
  messages: { id: string; role: string }[],
): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "assistant") return messages[i].id;
  }
  return null;
}

const OPENING_ASSISTANT_IDS = new Set(["welcome"]);

/**
 * Tampilkan eskalasi hanya di balasan AI setelah user bertanya —
 * bukan di chat pembuka / sapaan awal.
 */
export function shouldShowEscalateOffer(
  messages: { id: string; role: string }[],
  assistantMessageId: string,
): boolean {
  if (OPENING_ASSISTANT_IDS.has(assistantMessageId)) return false;
  if (lastAssistantMessageId(messages) !== assistantMessageId) return false;
  return messages.some((m) => m.role === "user");
}
