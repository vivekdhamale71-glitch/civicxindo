import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, m } from "motion/react";
import { ArrowLeft, ArrowRight, Check, RotateCcw } from "lucide-react";
import { listSchemesLocal } from "@/api/schemes";
import { useT } from "@/i18n";
import { PageHeader } from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Select, Input } from "@/components/ui/misc";
import { SchemeCard } from "@/features/schemes/SchemeCard";
import { EmptyState } from "@/components/EmptyState";
import { evaluate, profileFromCitizen, type Profile } from "@/lib/eligibility";
import { GENDERS, OCCUPATIONS, SOCIAL_CATEGORIES, STATES } from "@/lib/reference";
import { spring, ease, staggerDelay } from "@/lib/motion";
import { cn, haptic, groupIN } from "@/lib/utils";
import { useSettings } from "@/store/settings";
import { useCitizen } from "@/features/session";
import type { Gender, Occupation, SocialCategory } from "@/lib/types";

type Answers = Partial<Profile>;
const QUESTIONS = ["state", "age", "gender", "income", "occupation", "category"] as const;
const INCOME_BANDS = [50000, 100000, 150000, 250000, 300000, 500000, 800000];

export default function Eligibility() {
  const { t, L, lang } = useT();
  const nav = useNavigate();
  const { citizen } = useCitizen();
  const markDone = useSettings((s) => s.markEligibilityDone);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [a, setA] = useState<Answers>(() => (citizen?.name ? profileFromCitizen(citizen) : {}));
  const [done, setDone] = useState(false);
  const { data: schemes } = useQuery({ queryKey: ["schemes-local"], queryFn: listSchemesLocal });

  const q = QUESTIONS[step];
  const value = a[q];
  const canNext = value !== undefined && value !== "" && !(q === "age" && (Number(value) < 1 || Number(value) > 120));

  const go = (d: 1 | -1) => {
    setDir(d);
    if (d === 1 && step === QUESTIONS.length - 1) {
      setDone(true);
      markDone();
      haptic();
      return;
    }
    setStep((s) => Math.max(0, Math.min(QUESTIONS.length - 1, s + d)));
  };

  const set = (v: Answers[keyof Answers]) => {
    haptic();
    setA((p) => ({ ...p, [q]: v }));
  };

  const results = useMemo(() => {
    if (!done || !schemes) return [];
    const p = a as Profile;
    return schemes
      .map((s) => ({ s, ...evaluate(s, p) }))
      .filter((r) => r.eligible)
      .sort((x, y) => y.s.benefitAmount - x.s.benefitAmount);
  }, [done, schemes, a]);

  if (done) {
    return (
      <div>
        <PageHeader
          title={t("elig.results_title", { n: results.length })}
          subtitle={t("elig.results_sub")}
          crumbs={[{ label: t("nav.eligibility"), to: "/eligibility" }, { label: t("elig.results") }]}
          actions={
            <Button variant="secondary" onClick={() => { setDone(false); setStep(0); }}>
              <RotateCcw aria-hidden /> {t("elig.restart")}
            </Button>
          }
        />
        <div className="mb-6 flex flex-wrap gap-2" aria-label={t("elig.your_answers")}>
          {QUESTIONS.map((k, i) => (
            <button key={k} onClick={() => { setDone(false); setStep(i); }} className="rounded-full border border-line/[0.12] bg-card px-3 py-1 text-sm text-ink hover:border-line/[0.3]">
              <span className="text-muted">{t(`elig.q_${k}_short`)}:</span> {answerLabel(k, a, lang)}
            </button>
          ))}
        </div>
        {results.length === 0 ? (
          <EmptyState title={t("elig.none")} body={t("elig.none_sub")} action={<Button onClick={() => nav("/schemes")}>{t("home.browse")}</Button>} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-live="polite">
            {results.map((r, i) => (
              <SchemeCard
                key={r.s.id}
                s={r.s}
                i={i}
                reasons={
                  <div className="mt-3">
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">{t("elig.why")}</p>
                    <ul className="flex flex-wrap gap-1.5">
                      {r.reasons.map((x, j) => (
                        <m.li
                          key={j}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ ...spring.snappy, delay: staggerDelay(i) + 0.25 + j * 0.12 }}
                          className="inline-flex items-center gap-1 rounded-full bg-approved/10 px-2.5 py-0.5 text-xs font-semibold text-approved"
                        >
                          {L(x.label)} <Check className="size-3" aria-label={t("elig.met")} />
                        </m.li>
                      ))}
                    </ul>
                  </div>
                }
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[640px]">
      <PageHeader title={t("elig.title")} subtitle={t("elig.sub")} crumbs={[{ label: t("nav.eligibility") }]} />
      {/* Tricolour progress */}
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="num font-semibold text-ink">{t("elig.progress", { n: step + 1, total: QUESTIONS.length })}</span>
        <span className="text-muted">{t("elig.private")}</span>
      </div>
      <div className="mb-8 h-1.5 overflow-hidden rounded-full bg-ink/[0.08]" role="progressbar" aria-valuemin={0} aria-valuemax={QUESTIONS.length} aria-valuenow={step + 1} aria-label={t("elig.progress_label")}>
        <m.div className="tricolour h-full origin-left rounded-full" style={{ height: "100%" }} animate={{ scaleX: (step + 1) / QUESTIONS.length }} initial={false} transition={spring.smooth} />
      </div>

      <div className="relative min-h-[360px]">
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <m.fieldset
            key={q}
            custom={dir}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: d * 40 }),
              center: { opacity: 1, x: 0 },
              exit: (d: number) => ({ opacity: 0, x: d * -40 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ ...spring.smooth, opacity: { duration: 0.2, ease: ease.out } }}
            className="card p-6 md:p-8"
          >
            <legend className="sr-only">{t(`elig.q_${q}`)}</legend>
            <h2 className="t-scale mb-1 text-xl font-semibold md:text-2xl" aria-hidden>{t(`elig.q_${q}`)}</h2>
            <p className="mb-6 text-sm text-muted">{t(`elig.h_${q}`)}</p>

            {q === "state" && (
              <Select aria-label={t("elig.q_state")} value={(value as string) ?? ""} onChange={(e) => set(e.target.value)}>
                <option value="" disabled>{t("common.select")}</option>
                {STATES.map((s) => <option key={s.name} value={s.name}>{lang === "hi" ? s.hi : s.name}</option>)}
              </Select>
            )}
            {q === "age" && (
              <div>
                <Input type="number" inputMode="numeric" min={1} max={120} aria-label={t("elig.q_age")} value={(value as number) ?? ""} onChange={(e) => setA((p) => ({ ...p, age: e.target.value === "" ? undefined : Number(e.target.value) }))} placeholder={t("elig.age_ph")} className="text-lg" />
                <div className="mt-4 flex flex-wrap gap-2">
                  {[18, 25, 40, 60, 70].map((n) => <Chip key={n} selected={value === n} onClick={() => set(n)}>{n}</Chip>)}
                </div>
              </div>
            )}
            {q === "gender" && (
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={t("elig.q_gender")}>
                {(Object.keys(GENDERS) as Gender[]).map((g) => <Chip key={g} big selected={value === g} onClick={() => set(g)}>{L(GENDERS[g])}</Chip>)}
              </div>
            )}
            {q === "income" && (
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t("elig.q_income")}>
                {INCOME_BANDS.map((n, i) => (
                  <Chip key={n} big selected={value === n} onClick={() => set(n)}>
                    {i === 0 ? t("elig.upto", { v: `₹${groupIN(n)}` }) : t("elig.upto", { v: `₹${groupIN(n)}` })}
                  </Chip>
                ))}
                <Chip big selected={value === 1500000} onClick={() => set(1500000)}>{t("elig.above", { v: "₹8,00,000" })}</Chip>
              </div>
            )}
            {q === "occupation" && (
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t("elig.q_occupation")}>
                {(Object.keys(OCCUPATIONS) as Occupation[]).map((o) => <Chip key={o} big selected={value === o} onClick={() => set(o)}>{L(OCCUPATIONS[o])}</Chip>)}
              </div>
            )}
            {q === "category" && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup" aria-label={t("elig.q_category")}>
                {(Object.keys(SOCIAL_CATEGORIES) as SocialCategory[]).map((c) => <Chip key={c} big selected={value === c} onClick={() => set(c)}>{L(SOCIAL_CATEGORIES[c])}</Chip>)}
              </div>
            )}
          </m.fieldset>
        </AnimatePresence>
      </div>

      <div className="sticky bottom-[calc(80px+env(safe-area-inset-bottom))] z-10 mt-6 flex gap-3 md:static">
        <Button variant="secondary" size="lg" onClick={() => go(-1)} disabled={step === 0} className="flex-1 sm:flex-none">
          <ArrowLeft aria-hidden /> {t("common.back")}
        </Button>
        <Button size="lg" onClick={() => go(1)} disabled={!canNext} className="flex-1" hapticTick>
          {step === QUESTIONS.length - 1 ? t("elig.see_results") : t("common.next")} <ArrowRight aria-hidden />
        </Button>
      </div>
    </div>
  );
}

function Chip({ selected, onClick, children, big }: { selected: boolean; onClick: () => void; children: React.ReactNode; big?: boolean }) {
  return (
    <m.button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      animate={{ scale: selected ? 1.02 : 1 }}
      transition={spring.snappy}
      className={cn(
        "relative flex items-center justify-center gap-2 rounded-full border px-4 text-[15px] font-semibold transition-colors",
        big ? "min-h-[52px]" : "min-h-[44px] min-w-[56px]",
        selected ? "border-primary bg-primary text-primary-fg" : "border-line/[0.14] bg-card text-ink hover:border-line/[0.3]",
      )}
    >
      {selected && <m.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={spring.snappy}><Check className="size-4" aria-hidden /></m.span>}
      {children}
    </m.button>
  );
}

function answerLabel(k: (typeof QUESTIONS)[number], a: Answers, lang: "en" | "hi") {
  const v = a[k];
  if (v === undefined) return "—";
  if (k === "gender") return GENDERS[v as Gender][lang];
  if (k === "occupation") return OCCUPATIONS[v as Occupation][lang];
  if (k === "category") return SOCIAL_CATEGORIES[v as SocialCategory][lang];
  if (k === "income") return Number(v) > 800000 ? "> ₹8,00,000" : `≤ ₹${groupIN(Number(v))}`;
  if (k === "state") return lang === "hi" ? STATES.find((s) => s.name === v)?.hi ?? String(v) : String(v);
  return String(v);
}

