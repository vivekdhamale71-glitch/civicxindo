import { useRef, useState } from "react";
import { m, useMotionValue, useTransform, animate } from "motion/react";
import { Wheel } from "./brand/Wheel";
import { spring } from "@/lib/motion";
import { haptic } from "@/lib/utils";

/** Pull-to-refresh with rubber-band stretch; the wheel spins as the indicator. Touch only. */
export function PullToRefresh({ onRefresh, children }: { onRefresh: () => Promise<unknown>; children: React.ReactNode }) {
  const y = useMotionValue(0);
  const rotate = useTransform(y, [0, 80], [0, 270]);
  const opacity = useTransform(y, [0, 30, 70], [0, 0.6, 1]);
  const start = useRef<number | null>(null);
  const [busy, setBusy] = useState(false);
  const armed = useRef(false);

  const onTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY > 0 || busy) return;
    start.current = e.touches[0].clientY;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (start.current === null) return;
    const d = e.touches[0].clientY - start.current;
    if (d <= 0) return y.set(0);
    const damped = 80 * (1 - Math.exp(-d / 160)) * 1.4; // rubber band
    y.set(damped);
    if (damped > 72 && !armed.current) {
      armed.current = true;
      haptic();
    } else if (damped < 72) armed.current = false;
  };
  const onTouchEnd = async () => {
    if (start.current === null) return;
    start.current = null;
    if (armed.current) {
      armed.current = false;
      setBusy(true);
      animate(y, 56, spring.smooth);
      const spin = animate(rotate, [rotate.get(), rotate.get() + 3600], { duration: 10, ease: "linear" });
      await Promise.all([onRefresh(), new Promise((r) => setTimeout(r, 500))]);
      spin.stop();
      setBusy(false);
    }
    animate(y, 0, spring.smooth);
  };

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} className="relative">
      <m.div style={{ opacity, y: useTransform(y, (v) => v - 44) }} className="pointer-events-none absolute inset-x-0 top-0 flex justify-center" aria-hidden>
        <m.span style={{ rotate }} className="flex size-10 items-center justify-center rounded-full bg-card text-ink shadow-card">
          <Wheel size={26} />
        </m.span>
      </m.div>
      <m.div style={{ y }}>{children}</m.div>
      {busy && <span className="sr-only" role="status">Refreshing</span>}
    </div>
  );
}
