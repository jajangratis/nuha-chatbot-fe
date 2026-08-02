type Props = {
  count: number;
  className?: string;
};

export function SessionUnreadBadge({ count, className = "" }: Props) {
  if (count <= 0) return null;

  return (
    <span
      className={`flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#AAE053] px-1.5 text-[10px] font-bold leading-none text-[#032626] ${className}`}
      aria-label={`${count} pesan belum dibaca`}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}
