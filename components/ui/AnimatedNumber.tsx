"use client";

import { useEffect, useRef, useState } from "react";

export function AnimatedNumber({
  value,
  format,
  duration = 900,
  trigger,
}: {
  value: number;
  format: (n: number) => string;
  duration?: number;
  trigger?: unknown;
}) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    let raf: number;
    const start = performance.now();
    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = from + (value - from) * eased;
      setDisplay(current);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, trigger]);

  return <span className="tabular">{format(display)}</span>;
}
