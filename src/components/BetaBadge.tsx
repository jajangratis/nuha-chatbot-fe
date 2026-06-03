type Props = {
  /** Header gelap (guest/support chat) */
  variant?: "onDark" | "onLight";
  className?: string;
};

export function BetaBadge({ variant = "onDark", className = "" }: Props) {
  const styles =
    variant === "onDark"
      ? "border-white/35 bg-white/15 text-white"
      : "border-[#014547]/20 bg-[#E8F9F8] text-[#014547]";

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${styles} ${className}`}
      title="Fitur masih dalam tahap beta"
    >
      Beta
    </span>
  );
}
