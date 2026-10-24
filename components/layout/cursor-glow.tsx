"use client";

import { useEffect, useRef } from "react";

/**
 * Soft colour wash that follows the pointer, in the spirit of the GitHub
 * Universe page. It never blocks clicks, and it stays still when the user
 * prefers reduced motion.
 */
export function CursorGlow() {
  const green = useRef<HTMLDivElement>(null);
  const violet = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !green.current || !violet.current) return;

    let frame = 0;
    const target = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.35 };
    const lead = { ...target };
    const trail = { ...target };

    const place = (node: HTMLDivElement, x: number, y: number) => {
      node.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    };

    const onMove = (event: PointerEvent) => {
      target.x = event.clientX;
      target.y = event.clientY;
    };

    const tick = () => {
      lead.x += (target.x - lead.x) * 0.18;
      lead.y += (target.y - lead.y) * 0.18;
      trail.x += (target.x - trail.x) * 0.08;
      trail.y += (target.y - trail.y) * 0.08;
      if (green.current) place(green.current, lead.x, lead.y);
      if (violet.current) place(violet.current, trail.x + 40, trail.y + 28);
      frame = requestAnimationFrame(tick);
    };

    place(green.current, lead.x, lead.y);
    place(violet.current, trail.x, trail.y);
    window.addEventListener("pointermove", onMove, { passive: true });
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[80] overflow-hidden">
      <div
        ref={green}
        className="absolute top-0 left-0 size-[34rem] rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(31,136,61,0.9) 0%, rgba(9,105,218,0.55) 42%, transparent 70%)",
        }}
      />
      <div
        ref={violet}
        className="absolute top-0 left-0 size-[26rem] rounded-full opacity-50 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(253,140,115,0.85) 0%, rgba(130,80,223,0.55) 46%, transparent 72%)",
        }}
      />
    </div>
  );
}
