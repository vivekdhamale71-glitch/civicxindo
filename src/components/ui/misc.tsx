import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, ref) => (
  <input ref={ref} className={cn("input", className)} {...p} />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...p }, ref) => (
  <textarea ref={ref} className={cn("input min-h-[112px] py-3", className)} {...p} />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...p }, ref) => (
  <div className="relative">
    <select ref={ref} className={cn("input appearance-none pr-10", className)} {...p}>
      {children}
    </select>
    <svg aria-hidden className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted" viewBox="0 0 16 16" fill="none">
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
));
Select.displayName = "Select";

export function Field({
  label, htmlFor, error, hint, children, required, className,
}: { label: React.ReactNode; htmlFor: string; error?: string | null; hint?: React.ReactNode; children: React.ReactNode; required?: boolean; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="field-label">
        {label}
        {required && <span className="ml-1 text-rejected-ink" aria-hidden>*</span>}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="mt-2 text-sm text-rejected-ink">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="mt-2 text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type Tone = "approved" | "review" | "rejected" | "info" | "neutral" | "saffron";
const toneCls: Record<Tone, string> = {
  approved: "bg-approved/10 text-approved",
  review: "bg-review/10 text-review-ink",
  rejected: "bg-rejected/10 text-rejected-ink",
  info: "bg-info/10 text-info-ink",
  neutral: "bg-ink/[0.06] text-ink",
  saffron: "bg-saffron/15 text-ink",
};
export function Badge({ tone = "neutral", className, children, dot }: { tone?: Tone; className?: string; children: React.ReactNode; dot?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5", toneCls[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton", className)} />;
}

export function Card({ className, children, as: As = "div", ...p }: React.HTMLAttributes<HTMLDivElement> & { as?: "div" | "section" | "article" }) {
  return (
    <As className={cn("card", className)} {...p}>
      {children}
    </As>
  );
}

export function IconTint({ children, className, size = 40 }: { children: React.ReactNode; className?: string; size?: number }) {
  return (
    <span className={cn("icon-tint", className)} style={{ width: size, height: size }}>
      {children}
    </span>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded border border-line/20 bg-raised px-1.5 text-xs font-semibold text-ink">{children}</kbd>;
}
