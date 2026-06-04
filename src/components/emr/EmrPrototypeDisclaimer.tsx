type Props = {
  /** `banner` = strip di bawah header dashboard; `inline` = teks di halaman login/pilih app */
  variant?: "banner" | "inline";
};

const TEXT =
  "Ini adalah contoh prototype atau gambaran kasar jika diimplementasikan di EMR.";

export function EmrPrototypeDisclaimer({ variant = "banner" }: Props) {
  if (variant === "inline") {
    return (
      <p
        className="mx-auto mt-4 max-w-md rounded-md border border-amber-200/90 bg-amber-50/95 px-3 py-2 text-center text-[11px] font-medium leading-snug text-amber-900"
        role="note"
      >
        {TEXT}
      </p>
    );
  }

  return (
    <div
      className="shrink-0 border-b border-amber-200/80 bg-amber-50 px-3 py-1.5 text-center text-[11px] font-medium leading-snug text-amber-900"
      role="note"
    >
      {TEXT}
    </div>
  );
}
