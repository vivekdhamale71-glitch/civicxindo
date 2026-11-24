import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { m } from "motion/react";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function Checkbox({ checked, onCheckedChange, id, label, className, disabled }: { checked: boolean; onCheckedChange: (v: boolean) => void; id?: string; label?: string; className?: string; disabled?: boolean }) {
  return (
    <CheckboxPrimitive.Root
      id={id}
      aria-label={label}
      checked={checked}
      disabled={disabled}
      onCheckedChange={(v) => onCheckedChange(v === true)}
      className={cn(
        "relative flex size-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus/30 disabled:opacity-40",
        "before:absolute before:-inset-2.5 before:content-['']",
        checked ? "border-primary bg-primary text-primary-fg" : "border-line/40 bg-card",
        className,
      )}
    >
      <CheckboxPrimitive.Indicator forceMount>
        <m.svg viewBox="0 0 16 16" className="size-4" initial={false} animate={{ scale: checked ? 1 : 0.4, opacity: checked ? 1 : 0 }} transition={spring.snappy}>
          <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </m.svg>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
