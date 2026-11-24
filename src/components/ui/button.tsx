import * as React from "react";
import { m, type HTMLMotionProps } from "motion/react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, haptic } from "@/lib/utils";
import { spring, tap } from "@/lib/motion";

export const buttonVariants = cva(
  "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus/30 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-[18px] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-fg hover:bg-primary-hover",
        secondary: "border border-line/[0.16] bg-card text-ink hover:bg-ink/[0.04]",
        ghost: "text-ink hover:bg-ink/[0.06]",
        danger: "bg-rejected text-white hover:bg-rejected/90",
        success: "bg-approved text-white hover:bg-approved/90",
        link: "h-auto px-0 text-info underline-offset-4 hover:underline",
      },
      size: {
        sm: "min-h-[36px] rounded-input px-3 text-sm",
        md: "min-h-[44px] rounded-input px-4 text-[15px]",
        lg: "min-h-[52px] rounded-input px-6 text-base",
        icon: "size-11 rounded-full",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children">, VariantProps<typeof buttonVariants> {
  children?: React.ReactNode;
  hapticTick?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, hapticTick, onClick, type = "button", ...props }, ref) => (
    <m.button
      ref={ref}
      type={type}
      whileTap={tap}
      transition={spring.snappy}
      className={cn(buttonVariants({ variant, size }), className)}
      onClick={(e) => {
        if (hapticTick) haptic();
        onClick?.(e);
      }}
      {...props}
    />
  ),
);
Button.displayName = "Button";
