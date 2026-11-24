import { useEffect, useRef } from "react";
import { useInView, useSpring, useReducedMotion } from "motion/react";
import { groupIN } from "@/lib/utils";

/** Counts up once, the first time it scrolls into view, in Indian digit grouping. */
export function AnimatedNumber({ value, format = groupIN, className }: { value: number; format?: (n: number) => string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduce = useReducedMotion();
  const mv = useSpring(0, { stiffness: 60, damping: 20, restDelta: 0.5 });

  useEffect(() => {
    if (!inView) return;
    if (reduce) mv.jump(value);
    else mv.set(value);
  }, [inView, value, mv, reduce]);

  useEffect(
    () =>
      mv.on("change", (v) => {
        if (ref.current) ref.current.textContent = format(v);
      }),
    [mv, format],
  );

  return (
    <span ref={ref} className={`num ${className ?? ""}`}>
      {format(0)}
    </span>
  );
}
