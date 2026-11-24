import { useLayoutEffect, useRef, useState } from "react";
import { m, useReducedMotion } from "motion/react";
import { Check, X, Undo2 } from "lucide-react";
import type { Application, TimelineEvent } from "@/lib/types";
import { STAGES } from "@/lib/types";
import { STAGE_LABELS } from "@/lib/reference";
import { useT } from "@/i18n";
import { formatDate, cn } from "@/lib/utils";
import { ease, spring } from "@/lib/motion";

/** Animated timeline: the line draws down to the current stage, completed dots fill with a ripple, the current one breathes. */
export function Timeline({ app, children }: { app: Application; children?: (stageIdx: number) => React.ReactNode }) {
  const { t, L, lang } = useT();
  const reduce = useReducedMotion();
  const box = useRef<HTMLOListElement>(null);
  const dots = useRef<(HTMLSpanElement | null)[]>([]);
  const [geo, setGeo] = useState<{ x: number; y1: number; yCur: number; yEnd: number } | null>(null);
  // app.stage is the last completed stage; the next one is "current" (in progress, sent back or rejected).
  const idx = STAGES.indexOf(app.stage);
  const curIdx = app.stage === "credited" ? idx : idx + 1;

  useLayoutEffect(() => {
    const measure = () => {
      const b = box.current?.getBoundingClientRect();
      const first = dots.current[0]?.getBoundingClientRect();
      const cur = dots.current[curIdx]?.getBoundingClientRect();
      const last = dots.current[STAGES.length - 1]?.getBoundingClientRect();
      if (!b || !first || !cur || !last) return;
      setGeo({ x: first.left - b.left + first.width / 2, y1: first.top - b.top + first.height / 2, yCur: cur.top - b.top + cur.height / 2, yEnd: last.top - b.top + last.height / 2 });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (box.current) ro.observe(box.current);
    return () => ro.disconnect();
  }, [curIdx, app.timeline.length]);

  const eventFor = (stage: string): TimelineEvent | undefined => [...app.timeline].reverse().find((e) => e.kind === stage);
  const extra = app.timeline.filter((e) => e.kind === "sent_back" || e.kind === "rejected" || e.kind === "resubmitted");
  const lineColor = app.status === "rejected" ? "rgb(var(--rejected))" : app.status === "sent_back" ? "rgb(var(--review))" : "rgb(var(--approved))";

  return (
    <ol ref={box} className="relative" aria-label={t("track.timeline")}>
      {geo && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          <line x1={geo.x} x2={geo.x} y1={geo.y1} y2={geo.yEnd} stroke="rgb(var(--line) / .14)" strokeWidth="2" strokeLinecap="round" />
          <m.line
            x1={geo.x} x2={geo.x} y1={geo.y1} y2={geo.yCur}
            stroke={lineColor} strokeWidth="2.5" strokeLinecap="round"
            initial={reduce ? { pathLength: 1, opacity: 0 } : { pathLength: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={reduce ? { duration: 0.15 } : { duration: 0.5 + curIdx * 0.15, ease: ease.out, delay: 0.15 }}
          />
        </svg>
      )}
      {STAGES.map((s, i) => {
        const ev = eventFor(s);
        const complete = i <= idx;
        const current = i === curIdx && app.stage !== "credited";
        const reached = i <= curIdx;
        const delay = 0.15 + (i / Math.max(1, curIdx)) * (0.5 + curIdx * 0.15);
        return (
          <li key={s} className="relative flex gap-4 pb-8 last:pb-0">
            <span ref={(el) => { dots.current[i] = el; }} className="relative z-[1] mt-0.5 flex size-8 shrink-0 items-center justify-center">
              {current && app.status === "active" && !reduce && <span className="absolute inset-0 animate-breathe rounded-full bg-review" aria-hidden />}
              <m.span
                className={cn(
                  "relative flex size-8 items-center justify-center rounded-full border-2",
                  reached && (complete && !current) ? "border-approved bg-approved text-white" : current ? (app.status === "rejected" ? "border-rejected bg-rejected text-white" : app.status === "sent_back" ? "border-review bg-review text-white" : "border-review bg-card text-review-ink") : "border-line/20 bg-card text-muted",
                )}
                initial={reached && !reduce ? { scale: 0.6 } : false}
                animate={{ scale: 1 }}
                transition={{ ...spring.snappy, delay: reduce ? 0 : delay }}
              >
                {reached && complete && !current ? <Check className="size-4" strokeWidth={3} aria-hidden /> : current && app.status === "rejected" ? <X className="size-4" strokeWidth={3} aria-hidden /> : current && app.status === "sent_back" ? <Undo2 className="size-4" aria-hidden /> : <span className="num text-xs font-bold">{i + 1}</span>}
                {reached && complete && !current && !reduce && (
                  <m.span aria-hidden className="absolute inset-0 rounded-full border-2 border-approved" initial={{ scale: 1, opacity: 0.6 }} animate={{ scale: 1.9, opacity: 0 }} transition={{ duration: 0.7, ease: ease.out, delay }} />
                )}
              </m.span>
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className={cn("font-semibold", reached ? "text-ink" : "text-muted")}>
                {L(STAGE_LABELS[s])}
                <span className="sr-only">{reached && complete && !current ? `, ${t("track.done")}` : current ? `, ${t("track.current")}` : `, ${t("track.pending")}`}</span>
              </p>
              {ev ? (
                <p className="text-sm text-body">
                  {ev.by} <span className="text-muted">· {ev.role}</span>
                  <br />
                  <time className="num text-xs text-muted" dateTime={ev.at}>{formatDate(ev.at, lang, true)}</time>
                </p>
              ) : current ? (
                <p className="text-sm text-review-ink">{t("track.in_progress")}</p>
              ) : (
                <p className="text-sm text-muted">{t("track.pending")}</p>
              )}
              {ev?.comment && <p className="mt-1 rounded-input bg-ink/[0.04] px-3 py-2 text-sm text-ink">{ev.comment}</p>}
              {current && children?.(i)}
            </div>
          </li>
        );
      })}
      {extra.length > 0 && (
        <li className="mt-6 border-t border-line/[0.08] pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{t("track.history")}</p>
          <ul className="space-y-2 text-sm">
            {extra.map((e) => (
              <li key={e.id} className="flex gap-2">
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", e.kind === "rejected" ? "bg-rejected" : e.kind === "sent_back" ? "bg-review" : "bg-info")} aria-hidden />
                <span><span className="font-semibold text-ink">{t(`track.ev_${e.kind}`)}</span> · {e.by} · <span className="num text-muted">{formatDate(e.at, lang, true)}</span>{e.comment && <><br /><span className="text-body">{e.comment}</span></>}</span>
              </li>
            ))}
          </ul>
        </li>
      )}
    </ol>
  );
}
