"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { withBasePath } from "@/lib/app-path";

const NUHA_DIRECT = "https://nuha.care/";

type EmbedMode = "proxy" | "direct";

function getForcedMode(): EmbedMode | null {
  const mode = process.env.NEXT_PUBLIC_NUHA_EMBED_MODE?.toLowerCase();
  if (mode === "proxy" || mode === "direct") return mode;
  return null;
}

/**
 * Tampilkan nuha.care lewat proxy (disarankan di belakang reverse proxy).
 * Mode direct sering putih karena nuha.care memblokir iframe dari domain lain.
 */
export function NuhaSiteEmbed() {
  const forced = getForcedMode();
  const [mode, setMode] = useState<EmbedMode | null>(forced);
  const [reloadKey, setReloadKey] = useState(0);
  const [checking, setChecking] = useState(forced === null);
  const [showFallback, setShowFallback] = useState(false);

  const pickMode = useCallback(async () => {
    if (forced) {
      setMode(forced);
      setChecking(false);
      return;
    }

    setChecking(true);
    try {
      const res = await fetch(withBasePath("/api/nuha-proxy/check"), {
        cache: "no-store",
      });
      const data = (await res.json()) as { available?: boolean };
      // Di belakang reverse proxy: proxy lebih andal daripada iframe direct
      setMode(data.available ? "proxy" : "proxy");
    } catch {
      setMode("proxy");
    } finally {
      setChecking(false);
    }
  }, [forced]);

  useEffect(() => {
    void pickMode();
  }, [pickMode]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "nuha-proxy-failed") {
        if (mode === "proxy" && forced !== "proxy") {
          setMode("direct");
          setReloadKey((k) => k + 1);
        }
        setShowFallback(true);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [mode, forced]);

  useEffect(() => {
    if (checking) return;
    const timer = window.setTimeout(() => setShowFallback(true), 12_000);
    return () => window.clearTimeout(timer);
  }, [checking, mode, reloadKey]);

  const iframeSrc = useMemo(() => {
    if (mode === "proxy") {
      return `${withBasePath("/api/nuha-proxy")}?path=/&_=${reloadKey}`;
    }
    if (mode === "direct") {
      return NUHA_DIRECT;
    }
    return "about:blank";
  }, [mode, reloadKey]);

  const handleReload = () => {
    setShowFallback(false);
    if (!forced) {
      void pickMode().then(() => setReloadKey((k) => k + 1));
    } else {
      setReloadKey((k) => k + 1);
    }
  };

  if (checking && mode === null) {
    return (
      <div className="fixed inset-0 z-0 flex items-center justify-center bg-[#F5F5F5] text-[#014547]">
        <p className="text-sm">Memuat Nuha Care...</p>
      </div>
    );
  }

  return (
    <>
      <iframe
        key={`${mode}-${reloadKey}`}
        title="Nuha Care"
        src={iframeSrc}
        className="fixed inset-0 z-0 h-full w-full border-0 bg-[#F5F5F5]"
        referrerPolicy="no-referrer-when-downgrade"
        allow="fullscreen"
        onLoad={() => setShowFallback(false)}
      />

      {showFallback && (
        <div className="pointer-events-none fixed inset-0 z-[1] flex items-end justify-center bg-gradient-to-t from-[#014547]/40 to-transparent pb-28">
          <div className="pointer-events-auto mx-4 max-w-md rounded-2xl border border-[#E8E8E8] bg-white p-4 text-center shadow-lg">
            <p className="text-sm font-medium text-[#014547]">
              Halaman Nuha tidak tampil?
            </p>
            <p className="mt-1 text-xs text-[#717171]">
              Biasanya karena pengaturan reverse proxy. Buka situs resmi atau
              muat ulang. Staff Support Hub:{" "}
              <a href={withBasePath("/login")} className="text-[#07C5BA] underline">
                masuk di sini
              </a>
              .
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <a
                href={NUHA_DIRECT}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-gradient-to-r from-[#639B15] to-[#AAE053] px-4 py-2 text-xs font-semibold text-white"
              >
                Buka nuha.care
              </a>
              <button
                type="button"
                onClick={handleReload}
                className="rounded-full border border-[#E0E0E0] px-4 py-2 text-xs font-medium text-[#014547]"
              >
                Muat ulang
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
