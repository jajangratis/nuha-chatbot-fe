import Link from "next/link";
import { withBasePath } from "@/lib/app-path";

type Props = {
  href?: string;
  className?: string;
  /** `onDark` = logo putih (header teal); `onLight` = logo berwarna (header putih) */
  variant?: "onDark" | "onLight";
};

/** Logo Nuha Care untuk header gelap atau terang. */
export function NuhaCareLogo({
  href = "/",
  className = "",
  variant = "onDark",
}: Props) {
  const src =
    variant === "onLight"
      ? withBasePath("/logo-nuha.svg")
      : withBasePath("/logo-nuha-white.svg");

  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Nuha Care"
      width={133}
      height={36}
      className={`h-8 w-auto object-contain sm:h-9 ${className}`}
    />
  );

  if (!href) return <span className="shrink-0">{img}</span>;

  const focusRing =
    variant === "onLight"
      ? "focus-visible:ring-[#7B68EE]/40"
      : "focus-visible:ring-white/40";

  return (
    <Link
      href={withBasePath(href)}
      className={`shrink-0 rounded-lg transition hover:opacity-90 focus:outline-none focus-visible:ring-2 ${focusRing}`}
      aria-label="Nuha Care"
    >
      {img}
    </Link>
  );
}
