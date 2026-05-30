import Link from "next/link";
import { withBasePath } from "@/lib/app-path";

type Props = {
  href?: string;
  className?: string;
};

/** Logo putih nuha.care untuk header gelap. */
export function NuhaCareLogo({ href = "/", className = "" }: Props) {
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={withBasePath("/logo-nuha-white.svg")}
      alt="Nuha Care"
      width={133}
      height={36}
      className={`h-8 w-auto object-contain sm:h-9 ${className}`}
    />
  );

  if (!href) return <span className="shrink-0">{img}</span>;

  return (
    <Link
      href={withBasePath(href)}
      className="shrink-0 rounded-lg transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      aria-label="Nuha Care"
    >
      {img}
    </Link>
  );
}
