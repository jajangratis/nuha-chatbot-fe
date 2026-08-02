"use client";

import { useEffect, useRef, useState } from "react";
import { useNuhaCloneUi } from "@/hooks/use-nuha-clone-ui";
import { getBasePath, withBasePath } from "@/lib/app-path";

type MirrorManifest = {
  css: string[];
};

/**
 * Clone HTML/CSS nuha.care (snapshot di public/nuha-care/mirror).
 * Regenerasi: npm run build-nuha-mirror
 */
export function NuhaLanding() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [bodyHtml, setBodyHtml] = useState<string | null>(null);
  const [cssFiles, setCssFiles] = useState<string[]>([
    "css/bundle-0.css",
    "css/bundle-1.css",
    "css/bundle-2.css",
  ]);
  const [error, setError] = useState<string | null>(null);

  /** Tanpa trailing slash — hindari URL ganda `/chatbot//nuha-care/...` */
  const base = getBasePath();

  useNuhaCloneUi(rootRef, Boolean(bodyHtml));

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const manifestRes = await fetch(withBasePath("/nuha-care/mirror/manifest.json"));
        if (manifestRes.ok) {
          const manifest = (await manifestRes.json()) as MirrorManifest;
          if (manifest.css?.length && !cancelled) {
            setCssFiles(manifest.css);
          }
        }

        const bodyRes = await fetch(withBasePath("/nuha-care/mirror/body.html"));
        if (!bodyRes.ok) {
          throw new Error(
            "Snapshot belum ada. Jalankan: npm run build-nuha-mirror (saat IP bisa akses nuha.care)",
          );
        }
        let html = await bodyRes.text();
        html = html.replaceAll("__NUHA_BASE__", base);
        if (!cancelled) setBodyHtml(html);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Gagal memuat clone nuha.care");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [base]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F5F5] p-8 text-center">
        <div className="max-w-md">
          <p className="text-lg font-semibold text-[#014547]">Clone nuha.care</p>
          <p className="mt-2 text-sm text-[#717171]">{error}</p>
        </div>
      </div>
    );
  }

  if (!bodyHtml) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F5F5]">
        <p className="text-sm text-[#014547]">Memuat nuha.care…</p>
      </div>
    );
  }

  return (
    <div className="nuha-clone-root min-h-screen bg-[#F5F5F5]">
      {cssFiles.map((file) => (
        <link
          key={file}
          rel="stylesheet"
          href={withBasePath(`/nuha-care/mirror/${file}`)}
        />
      ))}
      <link
        rel="stylesheet"
        href={withBasePath("/nuha-care/mirror/clone-overrides.css")}
      />
      <div
        ref={rootRef}
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />
    </div>
  );
}
