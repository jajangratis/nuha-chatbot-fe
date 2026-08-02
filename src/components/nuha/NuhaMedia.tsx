"use client";

import Image from "next/image";
import { useState } from "react";
import { nuhaAsset } from "@/lib/nuha-assets";

type NuhaMediaProps = {
  /** Path under `public/nuha-care/`, e.g. `/images/svg/logo.svg` */
  assetPath: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
};

/**
 * Gambar landing nuha.care dari cache lokal.
 * Tidak memanggil nuha.care saat render — aman saat IP diblokir.
 */
export function NuhaMedia({
  assetPath,
  alt,
  width,
  height,
  className,
  priority,
  fill,
  sizes,
}: NuhaMediaProps) {
  const [failed, setFailed] = useState(false);
  const src = nuhaAsset(assetPath);

  if (failed) {
    return (
      <span
        className={`inline-flex items-center justify-center bg-[#E8F5F3] text-[10px] font-medium text-[#014547]/60 ${className ?? ""}`}
        role="img"
        aria-label={alt}
      >
        {alt.slice(0, 1)}
      </span>
    );
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        sizes={sizes}
        priority={priority}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? 100}
      height={height ?? 100}
      className={className}
      priority={priority}
      onError={() => setFailed(true)}
    />
  );
}
