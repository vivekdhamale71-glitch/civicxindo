import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, m } from "motion/react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { listSchemes, isClosingSoon } from "@/api/schemes";
import { useT } from "@/i18n";
import { PageHeader } from "@/components/Breadcrumbs";
import { SchemeCard, SchemeCardSkeleton } from "@/features/schemes/SchemeCard";
import { Select } from "@/components/ui/misc";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { PullToRefresh } from "@/components/PullToRefresh";
import { CATEGORIES, STATES, stateLabel } from "@/lib/reference";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types";

export default function Schemes() {
  const { t, L, lang } = useT();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const level = params.get("level") ?? "";
  const cat = params.get("cat") ?? "";
  const state = params.get("state") ?? "";
  const soon = params.get("soon") === "1";
  const { data, isLoading } = useQuery({ queryKey: ["schemes"], queryFn: listSchemes });

  const set = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    setParams(next, { replace: true });
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (data ?? []).filter((x) => {
      if (s && !`${x.name.en} ${x.name.hi} ${x.tagline.en} ${x.tagline.hi} ${x.description.en} ${CATEGORIES[x.category].en}`.toLowerCase().includes(s)) return false;
      if (level && x.level !== level) return false;
      if (cat && x.category !== cat) return false;
      if (state && x.level === "state" && x.state !== state) return false;
      if (soon && !isClosingSoon(x)) return false;
      return true;
    });
  }, [data, q, level, cat, state, soon]);

  const active = [
    level && { k: "level", label: level === "central" ? t("scheme.central") : t("scheme.state") },
    cat && { k: "cat", label: L(CATEGORIES[cat as Category]) },
    state && { k: "state", label: stateLabel(state, lang) },
    soon && { k: "soon", label: t("schemes.closing_soon") },
  ].filter(Boolean) as { k: string; label: string }[];

  return (
    <PullToRefresh onRefresh={() => qc.invalidateQueries({ queryKey: ["schemes"] })}>
      <PageHeader title={t("schemes.title")} subtitle={t("schemes.sub")} crumbs={[{ label: t("nav.schemes") }]} />

      <div className="card mb-4 p-4">
        <div className="relative">
          <label htmlFor="scheme-q" className="sr-only">{t("schemes.search")}</label>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted" aria-hidden />
          <input id="scheme-q" type="search" value={q} onChange={(e) => set("q", e.target.value)} placeholder={t("schemes.search_ph")} className="input pl-11" autoComplete="off" />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex rounded-full bg-ink/[0.05] p-1" role="radiogroup" aria-label={t("schemes.level")}>
            {[["", t("common.all")], ["central", t("scheme.central")], ["state", t("scheme.state")]].map(([v, label]) => (
              <button key={v} role="radio" aria-checked={level === v} onClick={() => set("level", v)} className={cn("relative min-h-[36px] rounded-full px-4 text-sm font-semibold", level === v ? "text-ink" : "text-muted")}>
                {level === v && <m.span layoutId="lvl-pill" className="absolute inset-0 rounded-full bg-card shadow-card" transition={spring.snappy} />}
                <span className="relative">{label}</span>
              </button>
            ))}
          </div>
          <div className="w-full sm:w-56">
            <Select aria-label={t("schemes.state")} value={state} onChange={(e) => set("state", e.target.value)} className="min-h-[40px] py-1.5 text-sm">
              <option value="">{t("schemes.all_states")}</option>
              {STATES.map((s) => <option key={s.name} value={s.name}>{lang === "hi" ? s.hi : s.name}</option>)}
            </Select>
          </div>
          <label className="flex min-h-[44px] items-center gap-3 text-sm font-semibold text-ink">
            <Switch checked={soon} onCheckedChange={(v) => set("soon", v ? "1" : "")} label={t("schemes.closing_soon")} />
            {t("schemes.closing_soon")}
          </label>
        </div>
        <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4" role="group" aria-label={t("schemes.category")}>
          <SlidersHorizontal className="mt-2 size-4 shrink-0 text-muted" aria-hidden />
          {(Object.keys(CATEGORIES) as Category[]).map((c) => (
            <m.button
              key={c}
              whileTap={{ scale: 0.97 }}
              transition={spring.snappy}
              onClick={() => set("cat", cat === c ? "" : c)}
              aria-pressed={cat === c}
              className={cn("min-h-[36px] shrink-0 rounded-full border px-3 text-sm font-medium transition-colors", cat === c ? "border-primary bg-primary text-primary-fg" : "border-line/[0.14] text-ink hover:border-line/[0.3]")}
            >
              {L(CATEGORIES[c])}
            </m.button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex min-h-[36px] flex-wrap items-center gap-2" aria-live="polite">
        <p className="num mr-2 text-sm text-muted">{t("schemes.count", { n: filtered.length })}</p>
        <AnimatePresence initial={false}>
          {active.map((f) => (
            <m.button
              key={f.k}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={spring.snappy}
              onClick={() => set(f.k, "")}
              className="flex min-h-[32px] items-center gap-1 rounded-full bg-ink/[0.07] pl-3 pr-2 text-sm font-semibold text-ink"
              aria-label={t("schemes.remove_filter", { f: f.label })}
            >
              {f.label} <X className="size-3.5" aria-hidden />
            </m.button>
          ))}
        </AnimatePresence>
        {active.length > 1 && <Button variant="link" size="sm" onClick={() => setParams(q ? { q } : {}, { replace: true })}>{t("schemes.clear")}</Button>}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((i) => <SchemeCardSkeleton key={i} />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState title={t("schemes.empty")} body={t("schemes.empty_sub")} action={<Button onClick={() => setParams({}, { replace: true })}>{t("schemes.clear")}</Button>} />
      ) : (
        <m.div layout className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {filtered.map((s, i) => (
              <m.div key={s.id} layout exit={{ opacity: 0, scale: 0.96 }} transition={spring.smooth}>
                <SchemeCard s={s} i={i} />
              </m.div>
            ))}
          </AnimatePresence>
        </m.div>
      )}
    </PullToRefresh>
  );
}
