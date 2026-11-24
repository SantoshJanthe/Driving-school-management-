"use client";

import { useEffect, useState } from "react";

const COLORS = ["#ae85ff", "#f73678", "#c05200", "#583af7", "#5fed83", "#bba00a"];
const GLYPHS = ["-", "/", ")", ".", "+", "=", ">", "<", "*", "&", "("];
const POOL = 40;
const CELL = 16;

type Block = {
  x: number;
  y: number;
  size: number;
  color: string;
  text: string;
  active: boolean;
};

const emptyBlock = (index: number): Block => ({
  x: 0,
  y: 0,
  size: CELL,
  color: COLORS[index % COLORS.length],
  text: GLYPHS[index % GLYPHS.length],
  active: false,
});

/**
 * The GitHub Universe cursor: a short trail of coloured grid squares,
 * each holding a symbol, that appears under the pointer and fades away.
 */
export function CursorTrail() {
  const [blocks, setBlocks] = useState<Block[]>(() =>
    Array.from({ length: POOL }, (_, i) => emptyBlock(i)),
  );
  const [reduced, setReduced] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (reduced !== false) return;
    let cursor = 0;
    let lastX = -1;
    let lastY = -1;
    const timers = new Map<number, number>();
    let current = blocks;

    const onMove = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("button, a, input, textarea, select, label")) return;

      const x = Math.floor(event.clientX / CELL) * CELL;
      const y = Math.floor(event.clientY / CELL) * CELL;
      if (x === lastX && y === lastY) return;
      if (current.some((block) => block.active && block.x === x && block.y === y)) return;
      lastX = x;
      lastY = y;

      const index = cursor;
      cursor = (cursor + 1) % POOL;
      const previous = timers.get(index);
      if (previous !== undefined) window.clearTimeout(previous);

      current = current.map((block, i) =>
        i === index
          ? {
              ...block,
              x,
              y,
              size: CELL,
              active: true,
              color: COLORS[Math.floor(Math.random() * COLORS.length)],
              text: Math.random() < 0.3 ? " " : GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
            }
          : block,
      );
      setBlocks(current);

      const timer = window.setTimeout(
        () => {
          timers.delete(index);
          current = current.map((block, i) =>
            i === index && block.active ? { ...block, active: false } : block,
          );
          setBlocks(current);
        },
        100 + Math.random() * 300,
      );
      timers.set(index, timer);
    };

    document.addEventListener("mousemove", onMove);
    return () => {
      document.removeEventListener("mousemove", onMove);
      for (const timer of timers.values()) window.clearTimeout(timer);
    };
    // The pool is recreated only when reduced motion changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  if (reduced !== false) return null;

  return (
    <>
      {blocks.map((block, index) => (
        <div
          key={index}
          aria-hidden
          className="pointer-events-none fixed top-0 left-0 z-[70] grid place-items-center font-mono leading-none font-semibold text-[#1f2328]"
          style={{
            transform: `translate(${block.x}px, ${block.y}px)`,
            width: block.size,
            height: block.size,
            fontSize: block.size * 0.55,
            opacity: block.active ? 1 : 0,
          }}
        >
          <span className="absolute inset-0" style={{ backgroundColor: block.color }} />
          <span className="relative">{block.text}</span>
        </div>
      ))}
    </>
  );
}
