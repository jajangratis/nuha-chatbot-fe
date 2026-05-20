"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const NUHA_DIRECT = "https://nuha.care/";

type EmbedMode = "proxy" | "direct";

/**
 * Tampilkan nuha.care: proxy jika server lolos WAF, else iframe langsung (browser user).
 */
export function NuhaSiteEmbed() {
  const [mode, setMode] = useState<EmbedMode | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [checking, setChecking] = useState(true);

  const pickMode = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/nuha-proxy/check", { cache: "no-store" });
      const data = (await res.json()) as { available?: boolean };
      setMode(data.available ? "proxy" : "direct");
    } catch {
      setMode("direct");
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void pickMode();
  }, [pickMode]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "nuha-proxy-failed" && mode === "proxy") {
        setMode("direct");
        setReloadKey((k) => k + 1);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [mode]);

  const iframeSrc = useMemo(() => {
    if (mode === "proxy") {
      return `/api/nuha-proxy?path=/&_=${reloadKey}`;
    }
    if (mode === "direct") {
      return NUHA_DIRECT;
    }
    return "about:blank";
  }, [mode, reloadKey]);

  const handleReload = () => {
    if (mode === "direct") {
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
        className="fixed inset-0 z-0 h-full w-full border-0 bg-white"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <button
        type="button"
        onClick={handleReload}
        className="fixed bottom-24 right-5 z-[1] rounded-full border border-[#E0E0E0]/80 bg-white/90 px-3 py-1.5 text-[10px] font-medium text-[#014547] shadow-sm backdrop-blur-sm transition hover:bg-white md:bottom-6 md:right-24"
        title="Muat ulang halaman Nuha"
      >
        Muat ulang
      </button>
    </>
  );
}
