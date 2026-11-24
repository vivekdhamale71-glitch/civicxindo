import { m } from "motion/react";
import { CalendarClock, ArrowRight } from "lucide-react";
import type { Scheme } from "@/lib/types";
import { PLink } from "@/components/PLink";
import { SchemePhoto } from "@/components/brand/SchemePhoto";
import { Badge } from "@/components/ui/misc";
import { useT } from "@/i18n";
import { CATEGORIES, stateLabel } from "@/lib/reference";
import { daysLeft, formatDate, cn } from "@/lib/utils";
import { isClosingSoon } from "@/api/schemes";
import { spring, fadeUp } from "@/lib/motion";

export function LevelBadge({ s }: { s: Scheme }) {
  const { t, lang } = useT();
  return <Badge tone={s.level === "central" ? "info" : "saffron"}>{s.level === "central" ? t("scheme.central") : `${t("scheme.state")} · ${stateLabel(s.state ?? "", lang)}`}</Badge>;
}

export function ClosingBadge({ s }: { s: Scheme }) {
  const { t } = useT();
  if (s.status === "paused") return <Badge tone="neutral">{t("scheme.paused")}</Badge>;
  const d = daysLeft(s.closes);
  if (d < 0) return <Badge tone="neutral">{t("scheme.closed")}</Badge>;
  if (!isClosingSoon(s)) return null;
  return (
    <Badge tone="rejected" className="animate-pulse-soft">
      {d === 0 ? t("scheme.closes_today") : t(d === 1 ? "scheme.closing_in_1" : "scheme.closing_in", { n: d })}
    </Badge>
  );
}

export function SchemeCard({ s, i = 0, reasons }: { s: Scheme; i?: number; reasons?: React.ReactNode }) {
  const { t, L, lang } = useT();
  return (
    <m.article variants={fadeUp} initial="hidden" animate="show" custom={i} className="group relative h-full">
      <m.div whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} transition={spring.snappy} className="relative h-full">
        {/* Pre-rendered hover shadow; only its opacity animates. */}
        <span aria-hidden className="absolute inset-0 rounded-card opacity-0 shadow-lift transition-opacity duration-300 group-hover:opacity-100" />
        <PLink to={`/schemes/${s.id}`} className="card relative flex h-full flex-col overflow-hidden focus-visible:ring-4 focus-visible:ring-focus/30">
          <m.div layoutId={`scheme-art-${s.id}`} transition={spring.smooth} className="relative aspect-[2/1] w-full overflow-hidden bg-ink/[0.03] sm:aspect-[16/9]">
            <SchemePhoto schemeId={s.id} category={s.category} />
          </m.div>
          <div className="flex flex-1 flex-col p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <m.span layoutId={`scheme-badge-${s.id}`} transition={spring.smooth}>
                <LevelBadge s={s} />
              </m.span>
              <span className="text-xs font-medium text-muted">{L(CATEGORIES[s.category])}</span>
              <ClosingBadge s={s} />
            </div>
            <m.h3 layoutId={`scheme-title-${s.id}`} transition={spring.smooth} className="t-scale text-[17px] font-semibold leading-snug text-ink">
              {L(s.name)}
            </m.h3>
            <p className="mt-1 line-clamp-2 text-sm text-body">{L(s.tagline)}</p>
            {reasons}
            <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-sm">
              <span className="num font-semibold text-ink">{L(s.benefitLabel)}</span>
              <span className={cn("flex items-center gap-1 text-xs text-muted")}>
                <CalendarClock className="size-3.5" aria-hidden />
                {t("scheme.last_date")}: {formatDate(s.closes, lang)}
              </span>
            </div>
          </div>
          <ArrowRight aria-hidden className="absolute right-4 top-4 size-5 rounded-full bg-card/90 p-0.5 text-ink opacity-0 transition-opacity group-hover:opacity-100" />
        </PLink>
      </m.div>
    </m.article>
  );
}

export function SchemeCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-[2/1] w-full rounded-none sm:aspect-[16/9]" />
      <div className="p-4">
        <div className="skeleton mb-3 h-5 w-24 rounded-full" />
        <div className="skeleton mb-2 h-5 w-3/4" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton mt-6 h-4 w-1/2" />
      </div>
    </div>
  );
}
