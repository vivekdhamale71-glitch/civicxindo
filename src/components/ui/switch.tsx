import * as SwitchPrimitive from "@radix-ui/react-switch";
import { m } from "motion/react";
import { spring } from "@/lib/motion";
import { cn, haptic } from "@/lib/utils";

export function Switch({ checked, onCheckedChange, id, label, className }: { checked: boolean; onCheckedChange: (v: boolean) => void; id?: string; label?: string; className?: string }) {
  return (
    <SwitchPrimitive.Root
      id={id}
      aria-label={label}
      checked={checked}
      onCheckedChange={(v) => {
        haptic();
        onCheckedChange(v);
      }}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus/30",
        checked ? "bg-primary" : "bg-ink/20",
        "before:absolute before:-inset-2 before:content-['']",
        className,
      )}
    >
      <SwitchPrimitive.Thumb asChild>
        <m.span
          layout
          transition={spring.snappy}
          className={cn("block size-6 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.25)]", checked ? "ml-auto" : "ml-0")}
        />
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  );
}
