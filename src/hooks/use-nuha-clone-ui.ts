"use client";

import { useEffect, type RefObject } from "react";
import { mountDesktopNavDropdowns } from "@/lib/nuha-nav-dropdown";

/** Interaktivitas minimal untuk HTML clone nuha.care (menu mobile, dropdown nav). */
export function useNuhaCloneUi(
  rootRef: RefObject<HTMLDivElement | null>,
  active: boolean,
) {
  useEffect(() => {
    if (!active) return;
    const root = rootRef.current;
    if (!root) return;

    const teardownDropdowns = mountDesktopNavDropdowns(root);

    const mobileOpenBtn = root.querySelector('[aria-label="Open menu"]');
    const mobileCloseBtn = root.querySelector('[aria-label="Close menu"]');
    const mobileOverlay = Array.from(root.querySelectorAll(".fixed.inset-0")).find(
      (el) => el.className.includes("bg-black"),
    );
    const mobileDrawer = Array.from(
      root.querySelectorAll(".fixed.inset-y-0.right-0"),
    ).find((el) => el.className.includes("max-w-sm"));

    const openMenu = () => {
      mobileOverlay?.classList.remove("opacity-0", "pointer-events-none");
      mobileDrawer?.classList.remove("translate-x-full");
    };
    const closeMenu = () => {
      mobileOverlay?.classList.add("opacity-0", "pointer-events-none");
      mobileDrawer?.classList.add("translate-x-full");
    };

    mobileOpenBtn?.addEventListener("click", openMenu);
    mobileCloseBtn?.addEventListener("click", closeMenu);
    mobileOverlay?.addEventListener("click", closeMenu);

    const cleanups: (() => void)[] = [];

    const testimonialSection = root.querySelector("#testimoni");
    let testimonialTimer: ReturnType<typeof setInterval> | undefined;
    if (testimonialSection) {
      const slides = testimonialSection.querySelectorAll(
        "[data-slot='carousel-item']",
      );
      if (slides.length > 1) {
        let idx = 0;
        testimonialTimer = setInterval(() => {
          idx = (idx + 1) % slides.length;
          slides.forEach((el, i) => {
            if (!(el instanceof HTMLElement)) return;
            el.style.display = i === idx ? "" : "none";
          });
        }, 6000);
      }
    }

    root.querySelectorAll('a[href="#hubungi"], a[href="#bantuan"]').forEach((a) => {
      a.addEventListener("click", closeMenu);
    });

    root.querySelectorAll("button").forEach((btn) => {
      if (!btn.closest(".max-w-sm")) return;
      const label = btn.textContent?.trim() ?? "";
      if (!label.startsWith("Layanan Kami") && !label.startsWith("Resources")) {
        return;
      }
      const panel = btn.nextElementSibling;
      if (!(panel instanceof HTMLElement)) return;
      const onToggle = (e: Event) => {
        e.preventDefault();
        panel.classList.toggle("max-h-0");
        panel.classList.toggle("opacity-0");
        panel.classList.toggle("max-h-[480px]");
        panel.classList.toggle("opacity-100");
        const chevron = btn.querySelector("span");
        chevron?.classList.toggle("rotate-180");
      };
      btn.addEventListener("click", onToggle);
      cleanups.push(() => btn.removeEventListener("click", onToggle));
    });

    return () => {
      teardownDropdowns();
      mobileOpenBtn?.removeEventListener("click", openMenu);
      mobileCloseBtn?.removeEventListener("click", closeMenu);
      mobileOverlay?.removeEventListener("click", closeMenu);
      cleanups.forEach((fn) => fn());
      if (testimonialTimer) clearInterval(testimonialTimer);
    };
  }, [active, rootRef]);
}
