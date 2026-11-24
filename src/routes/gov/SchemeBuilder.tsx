import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, m } from "motion/react";
import { ArrowLeft, ArrowRight, Plus, Trash2, Send, Eye, Check } from "lucide-react";
import { toast } from "sonner";
import { getScheme, saveScheme, submitScheme, deleteSchemeDraft } from "@/api/schemes";
import { useOfficial } from "@/features/session";
import { useT } from "@/i18n";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Badge, Card, Field, Input, Select, Skeleton, Textarea } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/EmptyState";
import { SchemeBody } from "@/features/schemes/SchemeBody";
import { Illustration } from "@/components/brand/Illustration";
import { CATEGORIES, DOC_TYPES, GENDERS, OCCUPATIONS, RULE_FIELDS, RULE_OPS, SOCIAL_CATEGORIES, STATES } from "@/lib/reference";
import { describeRule } from "@/lib/eligibility";
import { spring, ease } from "@/lib/motion";
import { cn, compactINR, uid } from "@/lib/utils";
import { SCHEME_TONE } from "./AuthorSchemes";
import type { Category, DocType, FormField, L10n, Rule, RuleField, RuleOp, Scheme } from "@/lib/types";

const STEPS = ["basics", "rules", "fields", "documents", "budget", "dates", "preview"] as const;

const VALUE_OPTIONS: Partial<Record<RuleField, Record<string, L10n>>> = {
  gender: GENDERS, occupation: OCCUPATIONS, category: SOCIAL_CATEGORIES,
  state: Object.fromEntries(STATES.map((s) => [s.name, { en: s.name, hi: s.hi }])),
};
const OPS_FOR: Record<RuleField, RuleOp[]> = { age: ["gte", "lte"], income: ["lte", "gte"], gender: ["eq"], occupation: ["eq", "in"], category: ["eq", "in"], state: ["eq"] };

export default function SchemeBuilder() {
  const { id = "" } = useParams();
  const { t, L, lang } = useT();
  const nav = useNavigate();
  const { official } = useOfficial();
  const { data, isLoading } = useQuery({ queryKey: ["scheme", id], queryFn: () => getScheme(id) });
  const [s, setS] = useState<Scheme | null>(null);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const init = useRef(false);

  useEffect(() => {
    if (data && !init.current) {
      init.current = true;
      setS(data);
    }
  }, [data]);

  const editable = !!s && (s.status === "draft" || s.status === "sent_back");
  useEffect(() => {
    if (!s || !editable || !init.current) return;
    const h = setTimeout(async () => { await saveScheme(s); setSaved(true); }, 400);
    return () => clearTimeout(h);
  }, [s, editable]);

  if (isLoading || (data && !s)) return <div><Skeleton className="mb-4 h-4 w-48" /><Skeleton className="h-96 rounded-card" /></div>;
  if (!s) return <EmptyState title={t("detail.not_found")} action={<Button onClick={() => nav("/gov/schemes")}>{t("gov.nav_schemes")}</Button>} />;

  const set = <K extends keyof Scheme>(k: K, v: Scheme[K]) => { setSaved(false); setS((p) => (p ? { ...p, [k]: v } : p)); };
  const setL = (k: "name" | "tagline" | "description" | "benefitLabel", lng: "en" | "hi", v: string) => set(k, { ...s[k], [lng]: v });

  const validate = (i: number) => {
    const e: Record<string, string> = {};
    if (i === 0) {
      if (s.name.en.trim().length < 4) e.name_en = t("author.v_name");
      if (s.name.hi.trim().length < 2) e.name_hi = t("author.v_name_hi");
      if (s.tagline.en.trim().length < 8) e.tagline = t("author.v_tagline");
      if (!/^[A-Z]{2,4}$/.test(s.code)) e.code = t("author.v_code");
      if (s.level === "state" && !s.state) e.state = t("author.v_state");
    }
    if (i === 1 && s.rules.length === 0) e.rules = t("author.v_rules");
    if (i === 3 && s.documents.length === 0) e.docs = t("author.v_docs");
    if (i === 4) {
      if (s.budget.total <= 0) e.total = t("author.v_budget");
      if (s.benefitAmount <= 0) e.amount = t("author.v_amount");
    }
    if (i === 5 && new Date(s.closes) <= new Date(s.opens)) e.closes = t("author.v_dates");
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const go = (d: 1 | -1) => {
    if (d === 1 && editable && !validate(step)) return;
    setDir(d);
    setStep((x) => Math.max(0, Math.min(STEPS.length - 1, x + d)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const submit = async () => {
    if (!official) return;
    for (let i = 0; i < 6; i++) if (!validate(i)) { setStep(i); toast.error(t("author.fix_errors")); return; }
    const final = { ...s, benefitLabel: s.benefitLabel.en ? s.benefitLabel : { en: compactINR(s.benefitAmount), hi: compactINR(s.benefitAmount, "hi") } };
    await submitScheme(final, official);
    toast.success(t("author.submitted"));
    nav("/gov/schemes");
  };

  return (
    <div className="pb-24 md:pb-0">
      <Breadcrumbs items={[{ label: t("gov.nav_schemes"), to: "/gov/schemes" }, { label: L(s.name) || t("author.untitled") }]} />
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="t-scale text-2xl font-semibold">{L(s.name) || t("author.untitled")}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted">
            <Badge tone={SCHEME_TONE[s.status]} dot>{t(`sstatus.${s.status}`)}</Badge>
            {s.id.startsWith("rev-") && <Badge tone="info">{t("author.revision")}</Badge>}
            {editable && (saved ? <span className="flex items-center gap-1"><Check className="size-3.5 text-approved" aria-hidden />{t("author.saved")}</span> : t("author.saving"))}
          </p>
          {s.reviewComment && <p className="mt-2 rounded-input bg-rejected/[0.06] p-3 text-sm text-ink"><span className="font-semibold">{t("author.comment")}:</span> {s.reviewComment}</p>}
        </div>
        {editable && s.status === "draft" && !s.id.startsWith("rev-") && (
          <Button variant="ghost" onClick={async () => { await deleteSchemeDraft(s.id); nav("/gov/schemes"); }}><Trash2 aria-hidden />{t("author.discard")}</Button>
        )}
      </header>

      <ol className="no-scrollbar mb-6 flex gap-1 overflow-x-auto" aria-label={t("apply.steps")}>
        {STEPS.map((x, i) => (
          <li key={x}>
            <button onClick={() => { setDir(i > step ? 1 : -1); setStep(i); }} aria-current={i === step ? "step" : undefined} className={cn("relative flex min-h-[40px] items-center gap-2 whitespace-nowrap rounded-full px-3 text-sm font-semibold", i === step ? "text-primary-fg" : "text-muted hover:text-ink")}>
              {i === step && <m.span layoutId="sb-step" className="absolute inset-0 rounded-full bg-primary" transition={spring.snappy} />}
              <span className="num relative">{i + 1}.</span><span className="relative">{t(`author.s_${x}`)}</span>
            </button>
          </li>
        ))}
      </ol>

      <AnimatePresence mode="popLayout" initial={false} custom={dir}>
        <m.div key={step} custom={dir} variants={{ enter: (d: number) => ({ opacity: 0, x: d * 32 }), center: { opacity: 1, x: 0 }, exit: (d: number) => ({ opacity: 0, x: d * -32 }) }} initial="enter" animate="center" exit="exit" transition={{ ...spring.smooth, opacity: { duration: 0.2, ease: ease.out } }}>
          <fieldset disabled={!editable} className="min-w-0">
            {STEPS[step] === "basics" && (
              <Card className="grid gap-4 p-6 sm:grid-cols-2">
                <Field label={t("author.name_en")} htmlFor="b-name-en" error={errors.name_en} required><Input id="b-name-en" value={s.name.en} onChange={(e) => setL("name", "en", e.target.value)} /></Field>
                <Field label={t("author.name_hi")} htmlFor="b-name-hi" error={errors.name_hi} required><Input id="b-name-hi" lang="hi" value={s.name.hi} onChange={(e) => setL("name", "hi", e.target.value)} /></Field>
                <Field label={t("author.tagline_en")} htmlFor="b-tag-en" error={errors.tagline} required><Input id="b-tag-en" value={s.tagline.en} onChange={(e) => setL("tagline", "en", e.target.value)} /></Field>
                <Field label={t("author.tagline_hi")} htmlFor="b-tag-hi"><Input id="b-tag-hi" lang="hi" value={s.tagline.hi} onChange={(e) => setL("tagline", "hi", e.target.value)} /></Field>
                <Field className="sm:col-span-2" label={t("author.desc_en")} htmlFor="b-desc-en"><Textarea id="b-desc-en" value={s.description.en} onChange={(e) => setL("description", "en", e.target.value)} /></Field>
                <Field className="sm:col-span-2" label={t("author.desc_hi")} htmlFor="b-desc-hi"><Textarea id="b-desc-hi" lang="hi" value={s.description.hi} onChange={(e) => setL("description", "hi", e.target.value)} /></Field>
                <Field label={t("author.code")} htmlFor="b-code" error={errors.code} hint={t("author.code_hint")} required><Input id="b-code" value={s.code} maxLength={4} onChange={(e) => set("code", e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))} /></Field>
                <Field label={t("author.category")} htmlFor="b-cat"><Select id="b-cat" value={s.category} onChange={(e) => set("category", e.target.value as Category)}>{(Object.keys(CATEGORIES) as Category[]).map((c) => <option key={c} value={c}>{L(CATEGORIES[c])}</option>)}</Select></Field>
                <Field label={t("author.level")} htmlFor="b-level"><Select id="b-level" value={s.level} onChange={(e) => set("level", e.target.value as Scheme["level"])}><option value="central">{t("scheme.central")}</option><option value="state">{t("scheme.state")}</option></Select></Field>
                {s.level === "state" && <Field label={t("apply.state")} htmlFor="b-state" error={errors.state} required><Select id="b-state" value={s.state ?? ""} onChange={(e) => set("state", e.target.value)}><option value="">{t("common.select")}</option>{STATES.map((x) => <option key={x.name} value={x.name}>{lang === "hi" ? x.hi : x.name}</option>)}</Select></Field>}
                <div className="overflow-hidden rounded-card border border-line/[0.08] sm:col-span-2"><Illustration category={s.category} className="aspect-[16/5] w-full" /></div>
              </Card>
            )}

            {STEPS[step] === "rules" && (
              <Card className="p-6">
                <p className="mb-4 text-sm text-muted">{t("author.rules_help")}</p>
                <ul className="space-y-3">
                  <AnimatePresence initial={false}>
                    {s.rules.map((r, i) => (
                      <m.li key={r.id} layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={spring.smooth} className="rounded-card border border-line/[0.1] p-3">
                        <div className="grid items-end gap-2 sm:grid-cols-[1fr_1fr_1.4fr_auto]">
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted sm:col-span-4">{i === 0 ? t("author.rule_if") : t("author.rule_and")}</span>
                          <Select aria-label={t("author.rule_field")} value={r.field} onChange={(e) => { const f = e.target.value as RuleField; updRule(i, { field: f, op: OPS_FOR[f][0], value: f === "age" ? 18 : f === "income" ? 250000 : Object.keys(VALUE_OPTIONS[f] ?? {})[0] ?? "" }); }}>
                            {Object.keys(RULE_FIELDS).map((f) => <option key={f} value={f}>{L(RULE_FIELDS[f])}</option>)}
                          </Select>
                          <Select aria-label={t("author.rule_op")} value={r.op} onChange={(e) => { const op = e.target.value as RuleOp; updRule(i, { op, value: op === "in" ? [String(Array.isArray(r.value) ? r.value[0] : r.value)] : Array.isArray(r.value) ? r.value[0] : r.value }); }}>
                            {OPS_FOR[r.field].map((o) => <option key={o} value={o}>{L(RULE_OPS[o])}</option>)}
                          </Select>
                          <RuleValue r={r} onChange={(value) => updRule(i, { value })} />
                          <Button variant="ghost" size="icon" onClick={() => set("rules", s.rules.filter((_, j) => j !== i))} aria-label={t("author.remove_rule")}><Trash2 aria-hidden /></Button>
                        </div>
                        <p className="mt-2 text-sm text-ink">{describeRule(r, lang)}</p>
                      </m.li>
                    ))}
                  </AnimatePresence>
                </ul>
                {errors.rules && <p role="alert" className="mt-2 text-sm text-rejected-ink">{errors.rules}</p>}
                <Button variant="secondary" className="mt-4" onClick={() => set("rules", [...s.rules, { id: uid("r"), field: "age", op: "gte", value: 18 }])}><Plus aria-hidden />{t("author.add_rule")}</Button>
              </Card>
            )}

            {STEPS[step] === "fields" && (
              <Card className="p-6">
                <p className="mb-4 text-sm text-muted">{t("author.fields_help")}</p>
                <ul className="space-y-3">
                  <AnimatePresence initial={false}>
                    {s.fields.map((f, i) => (
                      <m.li key={f.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={spring.smooth} className="grid items-end gap-2 rounded-card border border-line/[0.1] p-3 sm:grid-cols-[1.4fr_1.4fr_1fr_auto_auto]">
                        <Field label={t("author.label_en")} htmlFor={`fl-en-${f.id}`}><Input id={`fl-en-${f.id}`} value={f.label.en} onChange={(e) => updField(i, { label: { ...f.label, en: e.target.value } })} /></Field>
                        <Field label={t("author.label_hi")} htmlFor={`fl-hi-${f.id}`}><Input id={`fl-hi-${f.id}`} lang="hi" value={f.label.hi} onChange={(e) => updField(i, { label: { ...f.label, hi: e.target.value } })} /></Field>
                        <Field label={t("author.type")} htmlFor={`fl-ty-${f.id}`}>
                          <Select id={`fl-ty-${f.id}`} value={f.type} onChange={(e) => updField(i, { type: e.target.value as FormField["type"] })}>
                            {["text", "number", "yesno"].map((x) => <option key={x} value={x}>{t(`author.t_${x}`)}</option>)}
                          </Select>
                        </Field>
                        <label className="flex min-h-[44px] items-center gap-2 text-sm font-semibold text-ink"><Checkbox checked={f.required} onCheckedChange={(v) => updField(i, { required: v })} />{t("author.required")}</label>
                        <Button variant="ghost" size="icon" onClick={() => set("fields", s.fields.filter((_, j) => j !== i))} aria-label={t("author.remove_field")}><Trash2 aria-hidden /></Button>
                      </m.li>
                    ))}
                  </AnimatePresence>
                </ul>
                <Button variant="secondary" className="mt-4" onClick={() => set("fields", [...s.fields, { id: uid("f"), label: { en: "", hi: "" }, type: "text", required: true }])}><Plus aria-hidden />{t("author.add_field")}</Button>
              </Card>
            )}

            {STEPS[step] === "documents" && (
              <Card className="p-6">
                <p className="mb-4 text-sm text-muted">{t("author.docs_help")}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(Object.keys(DOC_TYPES) as DocType[]).map((d) => (
                    <label key={d} className={cn("flex min-h-[52px] cursor-pointer items-center gap-3 rounded-input border px-3", s.documents.includes(d) ? "border-primary bg-primary/[0.05]" : "border-line/[0.12]")}>
                      <Checkbox checked={s.documents.includes(d)} onCheckedChange={(v) => set("documents", v ? [...s.documents, d] : s.documents.filter((x) => x !== d))} />
                      <span className="font-medium text-ink">{L(DOC_TYPES[d].label)}</span>
                    </label>
                  ))}
                </div>
                {errors.docs && <p role="alert" className="mt-2 text-sm text-rejected-ink">{errors.docs}</p>}
              </Card>
            )}

            {STEPS[step] === "budget" && (
              <Card className="grid gap-4 p-6 sm:grid-cols-2">
                <Field label={t("author.total_budget")} htmlFor="bg-total" error={errors.total} hint={compactINR(s.budget.total, lang)} required><Input id="bg-total" type="number" min={0} value={s.budget.total} onChange={(e) => set("budget", { ...s.budget, total: Number(e.target.value) })} /></Field>
                <Field label={t("author.amount")} htmlFor="bg-amount" error={errors.amount} hint={t("author.amount_hint", { n: Math.floor(s.budget.total / Math.max(1, s.benefitAmount)).toLocaleString("en-IN") })} required><Input id="bg-amount" type="number" min={0} value={s.benefitAmount} onChange={(e) => set("benefitAmount", Number(e.target.value))} /></Field>
                <Field label={t("author.benefit_label_en")} htmlFor="bg-label-en"><Input id="bg-label-en" value={s.benefitLabel.en} placeholder="₹10,000 per year" onChange={(e) => setL("benefitLabel", "en", e.target.value)} /></Field>
                <Field label={t("author.benefit_label_hi")} htmlFor="bg-label-hi"><Input id="bg-label-hi" lang="hi" value={s.benefitLabel.hi} placeholder="₹10,000 प्रति वर्ष" onChange={(e) => setL("benefitLabel", "hi", e.target.value)} /></Field>
                <div className="sm:col-span-2">
                  <p className="field-label">{t("detail.benefits")}</p>
                  <ul className="space-y-2">
                    {s.benefits.map((b, i) => (
                      <li key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                        <Input aria-label={`${t("detail.benefits")} ${i + 1} (EN)`} value={b.en} onChange={(e) => set("benefits", s.benefits.map((x, j) => (j === i ? { ...x, en: e.target.value } : x)))} />
                        <Input aria-label={`${t("detail.benefits")} ${i + 1} (HI)`} lang="hi" value={b.hi} onChange={(e) => set("benefits", s.benefits.map((x, j) => (j === i ? { ...x, hi: e.target.value } : x)))} />
                        <Button variant="ghost" size="icon" onClick={() => set("benefits", s.benefits.filter((_, j) => j !== i))} aria-label={t("common.delete")}><Trash2 aria-hidden /></Button>
                      </li>
                    ))}
                  </ul>
                  <Button variant="secondary" size="sm" className="mt-2" onClick={() => set("benefits", [...s.benefits, { en: "", hi: "" }])}><Plus aria-hidden />{t("author.add_benefit")}</Button>
                </div>
              </Card>
            )}

            {STEPS[step] === "dates" && (
              <Card className="grid gap-4 p-6 sm:grid-cols-2">
                <Field label={t("detail.opens")} htmlFor="d-open" required><Input id="d-open" type="date" value={s.opens.slice(0, 10)} onChange={(e) => set("opens", new Date(e.target.value).toISOString())} /></Field>
                <Field label={t("detail.closes")} htmlFor="d-close" error={errors.closes} required><Input id="d-close" type="date" value={s.closes.slice(0, 10)} onChange={(e) => set("closes", new Date(e.target.value + "T23:59:00").toISOString())} /></Field>
              </Card>
            )}
          </fieldset>

          {STEPS[step] === "preview" && (
            <div>
              <div className="mb-4 flex items-center gap-2 rounded-input bg-info/10 p-3 text-sm text-ink"><Eye className="size-4 text-info" aria-hidden />{t("author.preview_note")}</div>
              <div className="pointer-events-none rounded-sheet border-2 border-dashed border-line/[0.15] p-3 md:p-6">
                <Card className="mb-6 overflow-hidden">
                  <Illustration category={s.category} className="aspect-[16/5] w-full" />
                  <div className="p-6"><h2 className="t-scale text-[28px] font-semibold">{L(s.name) || t("author.untitled")}</h2><p className="mt-1 text-body">{L(s.tagline)}</p></div>
                </Card>
                <SchemeBody s={{ ...s, benefitLabel: s.benefitLabel.en ? s.benefitLabel : { en: compactINR(s.benefitAmount), hi: compactINR(s.benefitAmount, "hi") } }} delay={0} />
              </div>
            </div>
          )}
        </m.div>
      </AnimatePresence>

      <div className="glass fixed inset-x-0 bottom-0 z-30 flex gap-3 border-t border-line/[0.08] p-3 pb-[calc(12px+env(safe-area-inset-bottom))] md:static md:mt-6 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <Button variant="secondary" size="lg" onClick={() => (step === 0 ? nav("/gov/schemes") : go(-1))}><ArrowLeft aria-hidden />{t("common.back")}</Button>
        {step < STEPS.length - 1 ? (
          <Button size="lg" className="flex-1 md:flex-none" onClick={() => go(1)}>{STEPS[step + 1] === "preview" ? t("author.preview") : t("common.next")}<ArrowRight aria-hidden /></Button>
        ) : editable ? (
          <Button size="lg" className="flex-1 md:flex-none" onClick={submit} hapticTick><Send aria-hidden />{t("author.submit")}</Button>
        ) : null}
      </div>
    </div>
  );

  function updRule(i: number, patch: Partial<Rule>) {
    set("rules", s!.rules.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }
  function updField(i: number, patch: Partial<FormField>) {
    set("fields", s!.fields.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  }
}

function RuleValue({ r, onChange }: { r: Rule; onChange: (v: Rule["value"]) => void }) {
  const { t, L } = useT();
  const opts = VALUE_OPTIONS[r.field];
  if (!opts) return <Input aria-label={t("author.rule_value")} type="number" min={0} value={Number(r.value)} onChange={(e) => onChange(Number(e.target.value))} />;
  if (r.op === "in") {
    const vals = Array.isArray(r.value) ? r.value : [String(r.value)];
    return (
      <div className="flex flex-wrap gap-1" role="group" aria-label={t("author.rule_value")}>
        {Object.entries(opts).map(([k, lab]) => (
          <button key={k} type="button" aria-pressed={vals.includes(k)} onClick={() => onChange(vals.includes(k) ? vals.filter((x) => x !== k) : [...vals, k])} className={cn("min-h-[36px] rounded-full border px-2.5 text-xs font-semibold", vals.includes(k) ? "border-primary bg-primary text-primary-fg" : "border-line/[0.14] text-ink")}>
            {L(lab)}
          </button>
        ))}
      </div>
    );
  }
  return (
    <Select aria-label={t("author.rule_value")} value={String(r.value)} onChange={(e) => onChange(e.target.value)}>
      {Object.entries(opts).map(([k, lab]) => <option key={k} value={k}>{L(lab)}</option>)}
    </Select>
  );
}
