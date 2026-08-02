import { withBasePath } from "@/lib/app-path";

type Props = {
  size?: "md" | "lg";
};

export function EmrNuhaLogo({ size = "md" }: Props) {
  const imgClass = size === "lg" ? "h-14 w-auto" : "h-11 w-auto";

  return (
    <div className="flex flex-col items-center justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={withBasePath("/logo-nuha.svg")}
        alt="NUHA"
        width={180}
        height={56}
        className={`${imgClass} mb-1.5 mt-2`}
      />
      <p className="text-center text-[10px] font-medium tracking-wide text-gray-500">
        Neural Universal Healthcare Application
      </p>
    </div>
  );
}
