import { m } from "motion/react";
import { fadeUp, inViewOnce } from "@/lib/motion";

export function Reveal({ children, i = 0, className, as = "div" }: { children: React.ReactNode; i?: number; className?: string; as?: "div" | "li" | "section" }) {
  const C = as === "li" ? m.li : as === "section" ? m.section : m.div;
  return (
    <C className={className} variants={fadeUp} initial="hidden" whileInView="show" viewport={inViewOnce} custom={i}>
      {children}
    </C>
  );
}
