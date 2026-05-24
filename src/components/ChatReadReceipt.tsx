type Props = {
  readAt?: string | null;
  variant?: "light" | "dark";
};

export function ChatReadReceipt({ readAt, variant = "light" }: Props) {
  const unreadClass =
    variant === "dark" ? "text-white/55" : "text-[#717171]/80";
  const readClass = variant === "dark" ? "text-[#AAE053]" : "text-[#07C5BA]";

  if (readAt) {
    return (
      <span
        className={`ml-1.5 inline text-[10px] font-medium ${readClass}`}
        title={`Dibaca ${new Date(readAt).toLocaleString("id-ID")}`}
        aria-label="Sudah dibaca"
      >
        ✓✓
      </span>
    );
  }

  return (
    <span
      className={`ml-1.5 inline text-[10px] ${unreadClass}`}
      title="Terkirim, belum dibaca"
      aria-label="Belum dibaca"
    >
      ✓
    </span>
  );
}
