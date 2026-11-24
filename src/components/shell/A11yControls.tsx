import { useSettings, type TextSize } from "@/store/settings";
import { useT } from "@/i18n";
import { Switch } from "../ui/switch";
import { PLink } from "../PLink";
import { cn } from "@/lib/utils";
import { m } from "motion/react";
import { spring } from "@/lib/motion";

export function A11yControls({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useT();
  const s = useSettings();
  const sizes: { v: TextSize; label: string }[] = [
    { v: "sm", label: "A−" }, { v: "md", label: "A" }, { v: "lg", label: "A+" }, { v: "xl", label: "A++" },
  ];
  return (
    <div className="space-y-6">
      <div>
        <p className="field-label">{t("settings.text_size")}</p>
        <div className="grid grid-cols-4 gap-1 rounded-input bg-ink/[0.05] p-1" role="radiogroup" aria-label={t("settings.text_size")}>
          {sizes.map((x) => (
            <button key={x.v} role="radio" aria-checked={s.textSize === x.v} onClick={() => s.setTextSize(x.v)} className={cn("relative min-h-[44px] rounded-[10px] text-sm font-semibold", s.textSize === x.v ? "text-ink" : "text-muted")}>
              {s.textSize === x.v && <m.span layoutId="ts-pill" className="absolute inset-0 rounded-[10px] bg-card shadow-card" transition={spring.snappy} />}
              <span className="relative">{x.label}</span>
            </button>
          ))}
        </div>
      </div>
      <Row label={t("settings.contrast")} hint={t("settings.contrast_hint")}>
        <Switch checked={s.contrast === "high"} onCheckedChange={(v) => s.setContrast(v ? "high" : "normal")} label={t("settings.contrast")} />
      </Row>
      <Row label={t("settings.dark")} hint={t("settings.dark_hint")}>
        <Switch checked={s.theme === "dark"} onCheckedChange={(v) => s.setTheme(v ? "dark" : "light")} label={t("settings.dark")} />
      </Row>
      <div className="flex flex-col gap-2 border-t border-line/[0.08] pt-4 text-sm">
        <a href="#main" onClick={onNavigate} className="py-2 font-semibold text-info hover:underline">{t("strip.skip")}</a>
        <PLink to="/screen-reader-access" onClick={onNavigate} className="py-2 font-semibold text-info hover:underline">{t("strip.screen_reader")}</PLink>
      </div>
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="font-semibold text-ink">{label}</p>
        {hint && <p className="text-sm text-muted">{hint}</p>}
      </div>
      {children}
    </div>
  );
}
