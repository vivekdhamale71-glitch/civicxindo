import { useState } from "react";
import { Contrast, Accessibility } from "lucide-react";
import { useSettings } from "@/store/settings";
import { useT } from "@/i18n";
import { PLink } from "../PLink";
import { LazySheet as Sheet } from "../ui/lazy-sheet";
import { A11yControls } from "./A11yControls";
import { cn } from "@/lib/utils";

/** Thin navy strip required by GIGW: identity on the left, accessibility tools on the right. */
export function TopStrip() {
  const { t } = useT();
  const s = useSettings();
  const [open, setOpen] = useState(false);
  const btn = "flex h-8 min-w-8 items-center justify-center rounded px-1.5 text-white/90 hover:bg-white/10 hover:text-white focus-visible:outline-white";
  return (
    <div className="bg-navy pt-safe text-white dark:bg-[#0A101D]">
      <div className="container-x flex h-9 items-center justify-between gap-2 text-[12px]">
        <p className="truncate font-medium">
          Government of India <span className="mx-1 opacity-50">|</span> <span lang="hi">भारत सरकार</span>
          <span className="ml-2 rounded bg-saffron px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-navy">{t("strip.demo")}</span>
        </p>
        <div className="flex items-center gap-0.5">
          <a href="#main" className={cn(btn, "hidden lg:flex")}>{t("strip.skip")}</a>
          <span className="mx-1 hidden h-4 w-px bg-white/20 lg:block" aria-hidden />
          <PLink to="/screen-reader-access" className={cn(btn, "hidden lg:flex")}>{t("strip.screen_reader")}</PLink>
          <span className="mx-1 hidden h-4 w-px bg-white/20 md:block" aria-hidden />
          <div className="hidden items-center md:flex" role="group" aria-label={t("strip.text_size")}>
            <button className={btn} onClick={() => s.bumpText(-1)} aria-label={t("strip.decrease")}>A<sup>−</sup></button>
            <button className={cn(btn, s.textSize === "md" && "bg-white/15")} onClick={() => s.bumpText(0)} aria-label={t("strip.reset")}>A</button>
            <button className={btn} onClick={() => s.bumpText(1)} aria-label={t("strip.increase")}>A<sup>+</sup></button>
          </div>
          <button className={cn(btn, "hidden md:flex")} onClick={s.toggleContrast} aria-pressed={s.contrast === "high"} aria-label={t("strip.contrast")}>
            <Contrast className="size-4" />
          </button>
          <button className={cn(btn, "md:hidden")} onClick={() => setOpen(true)} aria-label={t("strip.a11y_menu")}>
            <Accessibility className="size-4" />
          </button>
          <span className="mx-1 h-4 w-px bg-white/20" aria-hidden />
          <div role="group" aria-label={t("strip.language")} className="flex items-center">
            <button className={cn(btn, s.lang === "en" && "bg-white/15 font-semibold")} onClick={() => s.setLang("en")} aria-pressed={s.lang === "en"} lang="en">EN</button>
            <button className={cn(btn, s.lang === "hi" && "bg-white/15 font-semibold")} onClick={() => s.setLang("hi")} aria-pressed={s.lang === "hi"} lang="hi">हिं</button>
          </div>
        </div>
      </div>
      <Sheet open={open} onOpenChange={setOpen} title={t("strip.a11y_menu")}>
        <A11yControls onNavigate={() => setOpen(false)} />
      </Sheet>
    </div>
  );
}
