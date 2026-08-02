"use client";

import { useEffect, useState } from "react";

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export function useCountUp(
  target: number,
  active: boolean,
  durationMs = 1800,
  decimals = 0,
) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;

    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = easeOutCubic(progress);
      const next = target * eased;
      setValue(
        decimals > 0
          ? Number(next.toFixed(decimals))
          : Math.floor(next),
      );
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setValue(target);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, target, durationMs, decimals]);

  return value;
}
