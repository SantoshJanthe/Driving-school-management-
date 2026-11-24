const PEAKS = [
  { cx: 180, cy: 160, rx: 70, ry: 46, rings: 7, waves: 5, amp: 0.08 },
  { cx: 520, cy: 90, rx: 120, ry: 78, rings: 9, waves: 4, amp: 0.07 },
  { cx: 980, cy: 220, rx: 150, ry: 96, rings: 10, waves: 6, amp: 0.09 },
  { cx: 240, cy: 560, rx: 130, ry: 88, rings: 8, waves: 5, amp: 0.08 },
  { cx: 720, cy: 480, rx: 170, ry: 110, rings: 11, waves: 7, amp: 0.06 },
  { cx: 1120, cy: 640, rx: 90, ry: 60, rings: 6, waves: 4, amp: 0.1 },
  { cx: 860, cy: 820, rx: 140, ry: 86, rings: 8, waves: 5, amp: 0.07 },
] as const;

function ring(cx: number, cy: number, rx: number, ry: number, waves: number, amp: number, phase: number) {
  const steps = 96;
  let path = "";
  for (let i = 0; i <= steps; i += 1) {
    const t = (i / steps) * Math.PI * 2;
    const wobble = 1 + amp * Math.sin(waves * t + phase) + amp * 0.35 * Math.sin((waves + 2) * t - phase);
    const x = cx + Math.cos(t) * rx * wobble;
    const y = cy + Math.sin(t) * ry * (1 + amp * 0.7 * Math.cos(waves * t + phase * 0.8));
    path += `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return `${path}Z`;
}

function contours(seed: number) {
  return PEAKS.flatMap((peak, peakIndex) =>
    Array.from({ length: peak.rings }, (_, ringIndex) => {
      const scale = 0.34 + ringIndex * 0.16;
      return ring(
        peak.cx,
        peak.cy,
        peak.rx * scale,
        peak.ry * scale,
        peak.waves,
        peak.amp,
        seed + peakIndex * 0.7 + ringIndex * 0.35,
      );
    }),
  );
}

const LAYER_A = contours(0.4);
const LAYER_B = contours(1.8);

/** Warm contour field for the public landing page. Lines only, slow drift. */
export function TopographyBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        className="topo-layer-a absolute -top-[8%] -left-[8%] h-[120%] w-[120%]"
        viewBox="0 0 1280 900"
        fill="none"
      >
        {LAYER_A.map((d, index) => (
          <path key={index} d={d} stroke="#8a7355" strokeOpacity="0.28" strokeWidth="1.15" />
        ))}
      </svg>
      <svg
        className="topo-layer-b absolute -top-[4%] -left-[4%] h-[116%] w-[116%]"
        viewBox="0 0 1280 900"
        fill="none"
      >
        {LAYER_B.map((d, index) => (
          <path key={index} d={d} stroke="#1a1916" strokeOpacity="0.14" strokeWidth="0.9" />
        ))}
      </svg>
    </div>
  );
}
