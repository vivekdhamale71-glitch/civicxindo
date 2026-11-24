import { m, useReducedMotion } from "motion/react";
import { spring } from "@/lib/motion";

/** Official rubber stamp: settles onto the page once (scale 1.4 → 1, rotate −8°). */
export function Stamp({ animate = true, label = "APPROVED", labelHi = "स्वीकृत", date }: { animate?: boolean; label?: string; labelHi?: string; date?: string }) {
  const reduce = useReducedMotion();
  const play = animate && !reduce;
  return (
    <m.div
      className="pointer-events-none select-none text-approved"
      initial={play ? { scale: 1.4, rotate: -8, opacity: 0 } : { scale: 1, rotate: -8, opacity: animate && reduce ? 0 : 1 }}
      animate={{ scale: 1, rotate: -8, opacity: 0.9 }}
      transition={play ? { ...spring.snappy, delay: 0.25 } : { duration: 0.15 }}
      aria-hidden
    >
      <div className="relative flex flex-col items-center rounded-[14px] border-[3px] border-current px-5 py-2" style={{ boxShadow: "inset 0 0 0 2px rgb(var(--card)), inset 0 0 0 4px currentColor" }}>
        <span className="text-xl font-bold tracking-[0.18em]">{label}</span>
        <span lang="hi" className="text-base font-bold leading-tight">{labelHi}</span>
        {date && <span className="num mt-0.5 text-[10px] font-semibold tracking-wider">{date}</span>}
      </div>
    </m.div>
  );
}
