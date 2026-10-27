"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Fades content in as it scrolls into view. Content is fully visible on the server and without JavaScript;
 * only sections that start below the fold are hidden after hydration, then revealed. Respects reduced motion.
 */
export function Reveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"visible" | "hidden" | "shown">("visible");
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
    setState("hidden");
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setState("shown"); io.disconnect(); } }, { threshold: 0.08 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={state === "hidden" ? "reveal-hidden" : state === "shown" ? "reveal-shown" : undefined}>{children}</div>;
}
