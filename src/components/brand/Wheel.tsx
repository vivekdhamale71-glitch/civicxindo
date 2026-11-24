import { m } from "motion/react";
import { ease } from "@/lib/motion";

const SPOKES = Array.from({ length: 24 }, (_, i) => {
  const a = (i * Math.PI * 2) / 24;
  const r1 = 0.3, r2 = i % 2 === 0 ? 0.86 : 0.74;
  const r = (n: number) => Math.round(n * 1000) / 1000; // identical output in Node (prerender) and the browser
  return { x1: r(50 + Math.cos(a) * r1 * 40), y1: r(50 + Math.sin(a) * r1 * 40), x2: r(50 + Math.cos(a) * r2 * 40), y2: r(50 + Math.sin(a) * r2 * 40) };
});

/** The original civicXindo mark: double ring, open hub, 24 thin spokes of alternating length. */
export function Wheel({ size = 40, className, draw = false, strokeWidth = 1.6, title }: { size?: number; className?: string; draw?: boolean; strokeWidth?: number; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <m.circle
        cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth={strokeWidth * 1.6}
        initial={draw ? { pathLength: 0 } : false}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, ease: ease.out }}
      />
      <circle cx="50" cy="50" r="8" fill="none" stroke="currentColor" strokeWidth={strokeWidth * 1.4} />
      {SPOKES.map((s, i) => (
        <m.line
          key={i}
          {...s}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={draw ? { pathLength: 0, opacity: 0 } : false}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: draw ? (i / 24) * 0.6 : 0, ease: ease.out }}
        />
      ))}
    </svg>
  );
}
