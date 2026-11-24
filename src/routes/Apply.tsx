import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AnimatePresence, m } from "motion/react";
import { ArrowLeft, ArrowRight, Check, CloudOff, Download, FileText, Pencil, Plus, Send, Share2, CircleCheck, Clock } from "lucide-react";
import { toast } from "sonner";
import { getScheme, isOpen } from "@/api/schemes";
import { getApplication, submitApplication, type SubmitPayload } from "@/api/applications";
import { getDraft, saveDraft, deleteDraft } from "@/api/drafts";
import { listDocs } from "@/api/wallet";
import { enqueue } from "@/api/queue";
import { updateCitizen } from "@/api/citizens";
import { useCitizen } from "@/features/session";
import { RequireCitizen } from "@/features/RequireCitizen";
import { useT } from "@/i18n";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Skeleton, Badge } from "@/components/ui/misc";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet } from "@/components/ui/sheet";
import { Uploader } from "@/features/wallet/Uploader";
import { DocThumb } from "@/features/wallet/DocThumb";
import { OfficialDocument } from "@/features/documents/OfficialDocument";
import { downloadOfficialPdf } from "@/features/documents/pdf";
import { EmptyState } from "@/components/EmptyState";
import { DOC_TYPES, GENDERS, OCCUPATIONS, SOCIAL_CATEGORIES, STATES } from "@/lib/reference";
import { evaluate, ageFromDob } from "@/lib/eligibility";
import { spring, ease } from "@/lib/motion";
import { appUrl, cn, formatDate, formatINR, haptic, shareOrCopy } from "@/lib/utils";
import { useUI } from "@/store/ui";
import type { Application, Citizen, DocType, Gender, Occupation, Scheme, SocialCategory } from "@/lib/types";

interface FormData {
  profile: { name: string; dob: string; gender: Gender; state: string; district: string; income: string; occupation: Occupation; category: SocialCategory };
  answers: Record<string, string>;
  docs: Partial<Record<DocType, string>>;
  bank: { account: string; ifsc: string };
  declared: boolean;
}

const STEPS = ["profile", "questions", "documents", "review", "submit"] as const;

export default function Apply() {
  const { t } = useT();
  return (
    <RequireCitizen title={t("apply.title")}>
      <ApplyInner />
    </RequireCitizen>
  );
}

function initialData(c: Citizen): FormData {
  return {
    profile: { name: c.name, dob: c.dob, gender: c.gender, state: c.state, district: c.district, income: c.income ? String(c.income) : "", occupation: c.occupation, category: c.category },
    answers: {},
    docs: {},
    bank: { account: c.bankAccount, ifsc: c.ifsc },
    declared: false,
  };
}

function ApplyInner() {
  const { schemeId = "" } = useParams();
  const [params] = useSearchParams();
  const resubmitOf = params.get("resubmit") ?? undefined;
  const { t, L, lang } = useT();
  const nav = useNavigate();
  const qc = useQueryClient();
  const online = useUI((s) => s.online);
  const { citizen, id: citizenId } = useCitizen();
  const { data: scheme, isLoading } = useQuery({ queryKey: ["scheme", schemeId], queryFn: () => getScheme(schemeId) });
  const { data: wallet } = useQuery({ queryKey: ["wallet", citizenId], queryFn: () => listDocs(citizenId!), enabled: !!citizenId });

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [data, setData] = useState<FormData | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ app?: Application; queued?: boolean } | null>(null);
  const [uploadFor, setUploadFor] = useState<DocType | null>(null);
  const loaded = useRef(false);

  // Load draft (or the application being corrected) once.
  useEffect(() => {
    if (!citizen || loaded.current) return;
    loaded.current = true;
    (async () => {
      const draft = await getDraft(citizen.id, schemeId);
      if (draft) {
        setData(draft.data as unknown as FormData);
        setStep(draft.step);
        setSavedAt(draft.updatedAt);
        return;
      }
      const base = initialData(citizen);
      if (resubmitOf) {
        const prev = await getApplication(resubmitOf);
        if (prev) {
          base.answers = prev.answers;
          base.bank = { account: prev.bankAccount, ifsc: prev.ifsc };
          prev.documents.forEach((d) => { if (d.docId) base.docs[d.type] = d.docId; });
        }
      }
      setData(base);
    })();
  }, [citizen, schemeId, resubmitOf]);

  // Pre-select wallet documents in one tap: auto-attach the newest matching document.
  useEffect(() => {
    if (!data || !scheme || !wallet) return;
    const missing = scheme.documents.filter((d) => !data.docs[d]);
    const auto: Partial<Record<DocType, string>> = {};
    for (const d of missing) {
      const hit = wallet.find((w) => w.type === d);
      if (hit) auto[d] = hit.id;
    }
    if (Object.keys(auto).length) setData((p) => (p ? { ...p, docs: { ...auto, ...p.docs } } : p));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet, scheme, !!data]);

  // Autosave every change to IndexedDB (works offline).
  useEffect(() => {
    if (!data || !citizenId || result) return;
    const h = setTimeout(async () => {
      await saveDraft({ id: `${citizenId}:${schemeId}`, citizenId, schemeId, step, data: data as unknown as Record<string, unknown>, updatedAt: "", resubmitOf });
      setSavedAt(new Date().toISOString());
    }, 250);
    return () => clearTimeout(h);
  }, [data, step, citizenId, schemeId, result, resubmitOf]);

  const eligibility = useMemo(() => {
    if (!scheme || !data) return null;
    const p = data.profile;
    return evaluate(scheme, { state: p.state, age: ageFromDob(p.dob), gender: p.gender, income: Number(p.income) || 0, occupation: p.occupation, category: p.category });
  }, [scheme, data]);

  if (isLoading || !data) return <div><Skeleton className="mb-4 h-4 w-48" /><Skeleton className="mb-6 h-10 w-full" /><Skeleton className="h-80 w-full rounded-card" /></div>;
  if (!scheme) return <EmptyState title={t("detail.not_found")} action={<Button onClick={() => nav("/schemes")}>{t("home.browse")}</Button>} />;
  if (!isOpen(scheme) && !resubmitOf) return <EmptyState title={t("apply.closed")} body={t("apply.closed_sub")} action={<Button onClick={() => nav(`/schemes/${scheme.id}`)}>{t("common.back")}</Button>} />;

  if (result) return <Success scheme={scheme} result={result} citizen={citizen!} />;

  const upd = <K extends keyof FormData>(k: K, v: FormData[K]) => setData((p) => (p ? { ...p, [k]: v } : p));
  const updProfile = (k: keyof FormData["profile"], v: string) => {
    setData((p) => (p ? { ...p, profile: { ...p.profile, [k]: v } } : p));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const validate = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 0) {
      const p = data.profile;
      if (p.name.trim().length < 3) e.name = t("val.name");
      if (!p.dob || ageFromDob(p.dob) < 0 || ageFromDob(p.dob) > 120) e.dob = t("val.dob");
      if (!p.income || Number(p.income) < 0) e.income = t("val.income");
      if (!p.district.trim()) e.district = t("val.district");
    }
    if (s === 1) {
      for (const f of scheme.fields) if (f.required && !String(data.answers[f.id] ?? "").trim()) e[`q_${f.id}`] = t("val.required_field", { f: L(f.label) });
    }
    if (s === 2) {
      for (const d of scheme.documents) if (!data.docs[d]) e[`d_${d}`] = t("val.doc", { d: L(DOC_TYPES[d].label) });
      if (!/^\d{9,18}$/.test(data.bank.account)) e.account = t("val.account");
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(data.bank.ifsc.toUpperCase())) e.ifsc = t("val.ifsc");
    }
    if (s === 4 && !data.declared) e.declared = t("val.declare");
    setErrors(e);
    if (Object.keys(e).length) {
      const first = Object.keys(e)[0];
      setTimeout(() => document.getElementById(`f-${first}`)?.focus(), 50);
      return false;
    }
    return true;
  };

  const go = (d: 1 | -1) => {
    if (d === 1 && !validate(step)) return;
    haptic();
    setDir(d);
    setStep((s) => Math.max(0, Math.min(STEPS.length - 1, s + d)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async () => {
    if (!validate(4)) return;
    setSubmitting(true);
    const p = data.profile;
    const updated = await updateCitizen(citizen!.id, {
      name: p.name.trim(), dob: p.dob, gender: p.gender, state: p.state, district: p.district, income: Number(p.income), occupation: p.occupation, category: p.category,
      bankAccount: data.bank.account, ifsc: data.bank.ifsc.toUpperCase(),
    });
    const payload: SubmitPayload = {
      schemeId: scheme.id,
      citizen: updated,
      answers: data.answers,
      documents: scheme.documents.map((d) => ({ type: d, docId: data.docs[d], name: wallet?.find((w) => w.id === data.docs[d])?.name ?? L(DOC_TYPES[d].label) })),
      bankAccount: data.bank.account,
      ifsc: data.bank.ifsc.toUpperCase(),
      resubmitOf,
    };
    try {
      if (!navigator.onLine) {
        await enqueue("application", payload, L(scheme.name));
        await deleteDraft(citizen!.id, scheme.id);
        setResult({ queued: true });
      } else {
        const app = await submitApplication(payload);
        await deleteDraft(citizen!.id, scheme.id);
        setResult({ app });
      }
      haptic(20);
      qc.invalidateQueries();
      window.scrollTo({ top: 0 });
    } catch {
      toast.error(t("apply.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const stepTitle = t(`apply.step_${STEPS[step]}`);

  return (
    <div className="mx-auto max-w-[760px] pb-28 md:pb-0">
      <Breadcrumbs items={[{ label: t("nav.schemes"), to: "/schemes" }, { label: L(scheme.name), to: `/schemes/${scheme.id}` }, { label: t("apply.title") }]} />
      <header className="mb-6">
        <h1 className="t-scale text-2xl font-semibold md:text-[28px]">{resubmitOf ? t("apply.correct_title") : t("apply.title")}: {L(scheme.name)}</h1>
        <p className="mt-1 flex items-center gap-2 text-sm text-muted" aria-live="polite">
          {online ? <Check className="size-4 text-approved" aria-hidden /> : <CloudOff className="size-4" aria-hidden />}
          {savedAt ? t("apply.saved", { time: formatDate(savedAt, lang, true) }) : t("apply.autosave")}
        </p>
      </header>

      {/* Stepper */}
      <ol className="mb-6 grid grid-cols-5 gap-1" aria-label={t("apply.steps")}>
        {STEPS.map((s, i) => (
          <li key={s} className="min-w-0">
            <button
              type="button"
              disabled={i > step}
              onClick={() => i < step && (setDir(-1), setStep(i))}
              className="group block w-full text-left disabled:cursor-default"
              aria-current={i === step ? "step" : undefined}
            >
              <span className="relative block h-1.5 overflow-hidden rounded-full bg-ink/[0.08]">
                <m.span className={cn("absolute inset-0 origin-left rounded-full", i < step ? "bg-approved" : "bg-primary")} initial={false} animate={{ scaleX: i <= step ? 1 : 0 }} transition={spring.smooth} />
              </span>
              <span className={cn("mt-2 hidden truncate text-xs font-semibold sm:block", i === step ? "text-ink" : i < step ? "text-approved" : "text-muted")}>
                {i < step && <Check className="mr-1 inline size-3" aria-hidden />}
                {t(`apply.step_${s}`)}
              </span>
            </button>
          </li>
        ))}
      </ol>
      <p className="num mb-4 text-sm font-semibold text-ink sm:hidden">{t("apply.step_of", { n: step + 1, total: 5 })} · {stepTitle}</p>

      <div className="relative">
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <m.section
            key={step}
            custom={dir}
            variants={{ enter: (d: number) => ({ opacity: 0, x: d * 32 }), center: { opacity: 1, x: 0 }, exit: (d: number) => ({ opacity: 0, x: d * -32 }) }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ ...spring.smooth, opacity: { duration: 0.2, ease: ease.out } }}
            className="card p-6"
            aria-labelledby="step-title"
          >
            <h2 id="step-title" className="t-scale mb-1 text-xl font-semibold">{stepTitle}</h2>
            <p className="mb-6 text-sm text-muted">{t(`apply.step_${STEPS[step]}_sub`)}</p>

            {step === 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field className="sm:col-span-2" label={t("apply.name")} htmlFor="f-name" error={errors.name} required>
                  <Input id="f-name" value={data.profile.name} onChange={(e) => updProfile("name", e.target.value)} autoComplete="name" aria-invalid={!!errors.name} />
                </Field>
                <Field label={t("apply.dob")} htmlFor="f-dob" error={errors.dob} required>
                  <Input id="f-dob" type="date" value={data.profile.dob} onChange={(e) => updProfile("dob", e.target.value)} aria-invalid={!!errors.dob} />
                </Field>
                <Field label={t("apply.gender")} htmlFor="f-gender" required>
                  <Select id="f-gender" value={data.profile.gender} onChange={(e) => updProfile("gender", e.target.value)}>
                    {(Object.keys(GENDERS) as Gender[]).map((g) => <option key={g} value={g}>{L(GENDERS[g])}</option>)}
                  </Select>
                </Field>
                <Field label={t("apply.state")} htmlFor="f-state" required>
                  <Select id="f-state" value={data.profile.state} onChange={(e) => { updProfile("state", e.target.value); updProfile("district", STATES.find((s) => s.name === e.target.value)?.districts[0] ?? ""); }}>
                    {STATES.map((s) => <option key={s.name} value={s.name}>{lang === "hi" ? s.hi : s.name}</option>)}
                  </Select>
                </Field>
                <Field label={t("apply.district")} htmlFor="f-district" error={errors.district} required>
                  <Select id="f-district" value={data.profile.district} onChange={(e) => updProfile("district", e.target.value)}>
                    {(STATES.find((s) => s.name === data.profile.state)?.districts ?? []).map((d) => <option key={d} value={d}>{d}</option>)}
                  </Select>
                </Field>
                <Field label={t("apply.income")} htmlFor="f-income" error={errors.income} hint={t("apply.income_hint")} required>
                  <Input id="f-income" type="number" inputMode="numeric" min={0} value={data.profile.income} onChange={(e) => updProfile("income", e.target.value)} aria-invalid={!!errors.income} />
                </Field>
                <Field label={t("apply.occupation")} htmlFor="f-occupation" required>
                  <Select id="f-occupation" value={data.profile.occupation} onChange={(e) => updProfile("occupation", e.target.value)}>
                    {(Object.keys(OCCUPATIONS) as Occupation[]).map((o) => <option key={o} value={o}>{L(OCCUPATIONS[o])}</option>)}
                  </Select>
                </Field>
                <Field label={t("apply.category")} htmlFor="f-category" required>
                  <Select id="f-category" value={data.profile.category} onChange={(e) => updProfile("category", e.target.value)}>
                    {(Object.keys(SOCIAL_CATEGORIES) as SocialCategory[]).map((c) => <option key={c} value={c}>{L(SOCIAL_CATEGORIES[c])}</option>)}
                  </Select>
                </Field>
                {eligibility && !eligibility.eligible && (
                  <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-input border border-review/30 bg-review/10 p-4 text-sm text-ink sm:col-span-2" role="status">
                    <p className="font-semibold">{t("apply.not_eligible")}</p>
                    <ul className="mt-1 list-disc pl-5">{eligibility.reasons.filter((r) => !r.ok).map((r, i) => <li key={i}>{L(r.label)}</li>)}</ul>
                  </m.div>
                )}
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-4">
                {scheme.fields.length === 0 && <p className="text-body">{t("apply.no_questions")}</p>}
                {scheme.fields.map((f) => {
                  const id = `f-q_${f.id}`;
                  const err = errors[`q_${f.id}`];
                  const val = data.answers[f.id] ?? "";
                  const set = (v: string) => { upd("answers", { ...data.answers, [f.id]: v }); setErrors((e) => ({ ...e, [`q_${f.id}`]: "" })); };
                  return (
                    <Field key={f.id} label={L(f.label)} htmlFor={id} error={err} hint={f.hint ? L(f.hint) : undefined} required={f.required}>
                      {f.type === "select" ? (
                        <Select id={id} value={val} onChange={(e) => set(e.target.value)} aria-invalid={!!err}>
                          <option value="">{t("common.select")}</option>
                          {f.options?.map((o) => <option key={o.value} value={o.value}>{L(o.label)}</option>)}
                        </Select>
                      ) : f.type === "yesno" ? (
                        <div id={id} tabIndex={-1} className="flex gap-2" role="radiogroup" aria-label={L(f.label)}>
                          {["yes", "no"].map((v) => (
                            <m.button key={v} type="button" role="radio" aria-checked={val === v} whileTap={{ scale: 0.97 }} transition={spring.snappy} onClick={() => set(v)} className={cn("min-h-[44px] flex-1 rounded-full border text-sm font-semibold", val === v ? "border-primary bg-primary text-primary-fg" : "border-line/[0.14] text-ink")}>
                              {t(`common.${v}`)}
                            </m.button>
                          ))}
                        </div>
                      ) : (
                        <Input id={id} type={f.type === "number" ? "number" : "text"} inputMode={f.type === "number" ? "decimal" : undefined} value={val} onChange={(e) => set(e.target.value)} aria-invalid={!!err} />
                      )}
                    </Field>
                  );
                })}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <ul className="space-y-3">
                  {scheme.documents.map((d) => {
                    const options = wallet?.filter((w) => w.type === d) ?? [];
                    const chosen = data.docs[d];
                    const err = errors[`d_${d}`];
                    return (
                      <li key={d} className={cn("rounded-card border p-4", err ? "border-rejected/50" : "border-line/[0.1]")}>
                        <div className="flex items-center justify-between gap-3">
                          <p id={`f-d_${d}`} tabIndex={-1} className="flex items-center gap-2 font-semibold text-ink"><FileText className="size-4 text-muted" aria-hidden />{L(DOC_TYPES[d].label)}</p>
                          {chosen ? <Badge tone="approved" dot>{t("apply.attached")}</Badge> : <Badge tone="review">{t("apply.needed")}</Badge>}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {options.map((w) => (
                            <m.button key={w.id} type="button" whileTap={{ scale: 0.97 }} transition={spring.snappy} onClick={() => { haptic(); upd("docs", { ...data.docs, [d]: w.id }); setErrors((e) => ({ ...e, [`d_${d}`]: "" })); }} aria-pressed={chosen === w.id} className={cn("flex items-center gap-2 rounded-input border p-1.5 pr-3 text-left text-sm", chosen === w.id ? "border-primary bg-primary/[0.06]" : "border-line/[0.12]")}>
                              <DocThumb doc={w} className="h-9 w-12" />
                              <span className="max-w-[160px] truncate font-medium text-ink">{w.name}</span>
                              {chosen === w.id && <Check className="size-4 text-approved" aria-hidden />}
                            </m.button>
                          ))}
                          <Button variant="secondary" size="sm" onClick={() => setUploadFor(d)}><Plus aria-hidden />{options.length ? t("apply.upload_new") : t("apply.upload")}</Button>
                        </div>
                        {err && <p role="alert" className="mt-2 text-sm text-rejected-ink">{err}</p>}
                      </li>
                    );
                  })}
                </ul>
                <div className="grid gap-4 border-t border-line/[0.08] pt-6 sm:grid-cols-2">
                  <h3 className="text-base font-semibold sm:col-span-2">{t("apply.bank")}</h3>
                  <Field label={t("apply.account")} htmlFor="f-account" error={errors.account} required>
                    <Input id="f-account" inputMode="numeric" value={data.bank.account} onChange={(e) => { upd("bank", { ...data.bank, account: e.target.value.replace(/\D/g, "") }); setErrors((x) => ({ ...x, account: "" })); }} aria-invalid={!!errors.account} />
                  </Field>
                  <Field label={t("apply.ifsc")} htmlFor="f-ifsc" error={errors.ifsc} hint={t("apply.ifsc_hint")} required>
                    <Input id="f-ifsc" value={data.bank.ifsc} onChange={(e) => { upd("bank", { ...data.bank, ifsc: e.target.value.toUpperCase() }); setErrors((x) => ({ ...x, ifsc: "" })); }} aria-invalid={!!errors.ifsc} maxLength={11} className="uppercase" />
                  </Field>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <ReviewBlock title={t("apply.step_profile")} onEdit={() => { setDir(-1); setStep(0); }} rows={[
                  [t("apply.name"), data.profile.name],
                  [t("apply.dob"), formatDate(data.profile.dob, lang)],
                  [t("apply.gender"), L(GENDERS[data.profile.gender])],
                  [t("apply.state"), `${data.profile.district}, ${data.profile.state}`],
                  [t("apply.income"), formatINR(Number(data.profile.income))],
                  [t("apply.occupation"), L(OCCUPATIONS[data.profile.occupation])],
                  [t("apply.category"), L(SOCIAL_CATEGORIES[data.profile.category])],
                ]} />
                {scheme.fields.length > 0 && (
                  <ReviewBlock title={t("apply.step_questions")} onEdit={() => { setDir(-1); setStep(1); }} rows={scheme.fields.map((f) => [L(f.label), f.type === "yesno" ? t(`common.${data.answers[f.id]}`) : L(f.options?.find((o) => o.value === data.answers[f.id])?.label) || data.answers[f.id] || "—"])} />
                )}
                <ReviewBlock title={t("apply.step_documents")} onEdit={() => { setDir(-1); setStep(2); }} rows={[
                  ...scheme.documents.map((d) => [L(DOC_TYPES[d].label), wallet?.find((w) => w.id === data.docs[d])?.name ?? "—"] as [string, string]),
                  [t("apply.account"), `•••• ${data.bank.account.slice(-4)}`],
                  [t("apply.ifsc"), data.bank.ifsc],
                ]} />
              </div>
            )}

            {step === 4 && (
              <div>
                <div className="rounded-card bg-ink/[0.04] p-4 text-sm leading-relaxed text-ink">
                  <p>{t("apply.declaration", { name: data.profile.name || "—" })}</p>
                </div>
                <label htmlFor="f-declared" className="mt-4 flex min-h-[44px] cursor-pointer items-start gap-3">
                  <Checkbox id="f-declared" checked={data.declared} onCheckedChange={(v) => { upd("declared", v); setErrors((e) => ({ ...e, declared: "" })); }} />
                  <span className="pt-0.5 font-semibold text-ink">{t("apply.declare_cb")}</span>
                </label>
                {errors.declared && <p role="alert" className="mt-1 text-sm text-rejected-ink">{errors.declared}</p>}
                {!online && (
                  <p className="mt-4 flex items-center gap-2 rounded-input bg-review/10 p-3 text-sm text-ink"><CloudOff className="size-4 shrink-0" aria-hidden />{t("apply.offline_note")}</p>
                )}
              </div>
            )}
          </m.section>
        </AnimatePresence>
      </div>

      <div className="glass fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-30 flex gap-3 border-t border-line/[0.08] p-3 md:static md:mt-6 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <Button variant="secondary" size="lg" onClick={() => (step === 0 ? nav(`/schemes/${scheme.id}`) : go(-1))}>
          <ArrowLeft aria-hidden /> {t("common.back")}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button size="lg" className="flex-1 md:flex-none md:px-8" onClick={() => go(1)}>
            {step === 3 ? t("apply.confirm") : t("common.next")} <ArrowRight aria-hidden />
          </Button>
        ) : (
          <Button size="lg" className="flex-1 md:flex-none md:px-8" onClick={submit} disabled={submitting} hapticTick>
            <Send aria-hidden /> {submitting ? t("apply.submitting") : online ? t("apply.submit") : t("apply.submit_offline")}
          </Button>
        )}
      </div>

      <Sheet open={!!uploadFor} onOpenChange={(v) => !v && setUploadFor(null)} title={uploadFor ? t("apply.upload_title", { d: L(DOC_TYPES[uploadFor].label) }) : ""} description={t("apply.upload_sub")}>
        {uploadFor && citizenId && (
          <Uploader
            ownerId={citizenId}
            expected={uploadFor}
            onSaved={(d) => {
              // Attach to the detected type when the scheme needs it, otherwise to the slot the user chose.
              const slot = scheme.documents.includes(d.type) ? d.type : uploadFor;
              upd("docs", { ...data.docs, [slot]: d.id });
              setErrors((e) => ({ ...e, [`d_${slot}`]: "" }));
              setUploadFor(null);
              toast.success(t("wallet.saved"));
            }}
          />
        )}
      </Sheet>
    </div>
  );
}

function ReviewBlock({ title, rows, onEdit }: { title: string; rows: [string, string][]; onEdit: () => void }) {
  const { t } = useT();
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-base font-semibold">{title}</h3>
        <Button variant="ghost" size="sm" onClick={onEdit}><Pencil aria-hidden />{t("common.edit")}</Button>
      </div>
      <dl className="divide-y divide-line/[0.08] rounded-card border border-line/[0.08]">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[40%_1fr] gap-3 px-4 py-2.5 text-sm">
            <dt className="text-muted">{k}</dt>
            <dd className="font-medium text-ink">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Success({ scheme, result, citizen }: { scheme: Scheme; result: { app?: Application; queued?: boolean }; citizen: Citizen }) {
  const { t, L } = useT();
  const nav = useNavigate();
  const app = result.app;
  const qrId = "ack-qr";
  const rows = app
    ? [
        { label: "Applicant / आवेदक", value: app.applicantName },
        { label: "Scheme / योजना", value: scheme.name.en },
        { label: "Application status / स्थिति", value: "Submitted" },
        { label: "District / ज़िला", value: `${app.district}, ${app.state}` },
        { label: "Bank account / बैंक खाता", value: `•••• ${app.bankAccount.slice(-4)}` },
        { label: "Documents / दस्तावेज़", value: String(app.documents.length) },
      ]
    : [];
  const pdf = () =>
    app &&
    downloadOfficialPdf({
      title: "Application Acknowledgement",
      refNo: app.ref,
      date: app.submittedAt,
      rows: rows.map((r) => ({ label: r.label.split(" / ")[0], value: r.value })),
      signer: "civicXindo Acknowledgement Service (demo)",
      qrId,
      filename: `${app.ref.replace(/\//g, "-")}.pdf`,
      note: "Keep this reference number to track your application status. You will be notified when the status changes.",
    });
  return (
    <div className="mx-auto max-w-[760px]">
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={spring.smooth} className="mb-6 flex items-start gap-4">
        <m.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...spring.snappy, delay: 0.1 }} className={cn("flex size-12 shrink-0 items-center justify-center rounded-full", result.queued ? "bg-review/15 text-review-ink" : "bg-approved/15 text-approved")}>
          {result.queued ? <Clock className="size-6" aria-hidden /> : <CircleCheck className="size-6" aria-hidden />}
        </m.span>
        <div role="status" aria-live="polite">
          <h1 className="t-scale text-2xl font-semibold">{result.queued ? t("apply.queued_title") : t("apply.success_title")}</h1>
          <p className="mt-1 text-body">{result.queued ? t("apply.queued_sub") : t("apply.success_sub", { scheme: L(scheme.name) })}</p>
          {app && <p className="num mt-2 text-lg font-bold text-ink">{app.ref}</p>}
        </div>
      </m.div>
      {app && (
        <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring.smooth, delay: 0.1 }}>
          <OfficialDocument title="Application Acknowledgement" titleHi="आवेदन पावती" refNo={app.ref} date={app.submittedAt} rows={rows} signer="civicXindo Acknowledgement Service (demo)" qrId={qrId} />
        </m.div>
      )}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {app && <Button size="lg" onClick={pdf}><Download aria-hidden />{t("apply.download")}</Button>}
        {app && (
          <Button size="lg" variant="secondary" onClick={async () => { const r = await shareOrCopy({ title: t("apply.ack"), text: `${L(scheme.name)} – ${app.ref}`, url: appUrl(`/verify?ref=${encodeURIComponent(app.ref)}`) }); if (r === "copied") toast.success(t("common.link_copied")); }}>
            <Share2 aria-hidden />{t("common.share")}
          </Button>
        )}
        <Button size="lg" variant={app ? "ghost" : "primary"} onClick={() => nav(app ? `/track/${app.id}` : "/track")}>{t("apply.track_now")} <ArrowRight aria-hidden /></Button>
      </div>
      <p className="sr-only">{citizen.name}</p>
    </div>
  );
}
