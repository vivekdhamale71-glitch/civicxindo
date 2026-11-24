import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, m } from "motion/react";
import { AlertTriangle, Check, X, Undo2, Ban, FileText, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { getApplication, listQueue, recommend, sendBack, reject } from "@/api/applications";
import { getScheme } from "@/api/schemes";
import { getCitizen } from "@/api/citizens";
import { listDocs } from "@/api/wallet";
import { useOfficial } from "@/features/session";
import { useT } from "@/i18n";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Badge, Card, Field, Skeleton, Textarea } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { DocThumb } from "@/features/wallet/DocThumb";
import { SlaBadge } from "@/features/gov/sla";
import { DOC_TYPES, GENDERS, OCCUPATIONS, SOCIAL_CATEGORIES } from "@/lib/reference";
import { ageFromDob } from "@/lib/eligibility";
import { formatDate, formatINR, cn } from "@/lib/utils";
import { spring, ease } from "@/lib/motion";
import type { DocType } from "@/lib/types";

type Action = "send_back" | "reject";

export default function CaseFile() {
  const { id = "" } = useParams();
  const { t, L, lang } = useT();
  const nav = useNavigate();
  const { official } = useOfficial();
  const { data: app, isLoading } = useQuery({ queryKey: ["app", id], queryFn: () => getApplication(id) });
  const { data: scheme } = useQuery({ queryKey: ["scheme", app?.schemeId], queryFn: () => getScheme(app!.schemeId), enabled: !!app });
  const { data: citizen } = useQuery({ queryKey: ["citizen", app?.citizenId], queryFn: () => getCitizen(app!.citizenId), enabled: !!app });
  const { data: wallet } = useQuery({ queryKey: ["wallet", app?.citizenId], queryFn: () => listDocs(app!.citizenId), enabled: !!app });
  const { data: queue } = useQuery({ queryKey: ["queue-do"], queryFn: listQueue });
  const [docType, setDocType] = useState<DocType | null>(null);
  const [action, setAction] = useState<Action | null>(null);
  const [comment, setComment] = useState("");
  const [err, setErr] = useState("");
  const [leaving, setLeaving] = useState(false);
  const [busy, setBusy] = useState(false);

  if (isLoading) return <div><Skeleton className="mb-4 h-4 w-48" /><Skeleton className="mb-4 h-32 rounded-card" /><Skeleton className="h-96 rounded-card" /></div>;
  if (!app) return <EmptyState title={t("track.not_found")} action={<Button onClick={() => nav("/gov/queue")}>{t("gov.nav_queue")}</Button>} />;

  const actionable = app.stage === "auto_verified" && app.status === "active";
  const next = queue?.filter((a) => a.id !== app.id)[0];
  const activeDoc = docType ?? app.documents[0]?.type ?? null;
  const docForType = (ty: DocType) => {
    const att = app.documents.find((d) => d.type === ty);
    return wallet?.find((w) => w.id === att?.docId) ?? wallet?.find((w) => w.type === ty);
  };

  /** After an action the file slides out sideways and the next file opens. */
  const finish = async (msg: string) => {
    toast.success(msg);
    setLeaving(true);
    await new Promise((r) => setTimeout(r, 280));
    setLeaving(false);
    setDocType(null);
    nav(next ? `/gov/case/${next.id}` : "/gov/queue", { replace: true });
  };

  const doRecommend = async () => {
    if (!official) return;
    setBusy(true);
    await recommend(app.id, official);
    setBusy(false);
    finish(t("gov.recommended_toast", { ref: app.ref }));
  };
  const doAction = async () => {
    if (!official || !action) return;
    if (comment.trim().length < 10) return setErr(action === "reject" ? t("gov.reason_required") : t("gov.comment_required"));
    setBusy(true);
    if (action === "send_back") await sendBack(app.id, official, comment.trim());
    else await reject(app.id, official, comment.trim());
    setBusy(false);
    setAction(null);
    setComment("");
    finish(action === "send_back" ? t("gov.sent_back_toast", { ref: app.ref }) : t("gov.rejected_toast", { ref: app.ref }));
  };

  const doc = activeDoc ? docForType(activeDoc) : undefined;

  return (
    <AnimatePresence mode="wait">
      <m.div key={app.id} initial={{ opacity: 0, x: 40 }} animate={leaving ? { opacity: 0, x: -80 } : { opacity: 1, x: 0 }} transition={{ ...spring.smooth, opacity: { duration: 0.2, ease: ease.out } }} className="pb-24 md:pb-0">
        <Breadcrumbs items={[{ label: t("gov.nav_queue"), to: "/gov/queue" }, { label: app.ref }]} />
        <Card className="mb-6 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="num text-sm text-muted">{app.ref}</p>
              <h1 className="t-scale mt-1 text-2xl font-semibold">{app.applicantName}</h1>
              <p className="text-body">{L(scheme?.name)} · <span className="num font-semibold text-ink">{formatINR(app.amount)}</span></p>
              <div className="mt-3 flex flex-wrap gap-2"><StatusBadge app={app} />{actionable && <SlaBadge app={app} />}</div>
            </div>
            <Button variant="ghost" onClick={() => nav("/gov/queue")}><ArrowLeft aria-hidden />{t("gov.nav_queue")}</Button>
          </div>
        </Card>

        {app.flags.length > 0 && (
          <Card className="mb-6 border-rejected/30 bg-rejected/[0.05] p-4" role="alert">
            <p className="mb-2 flex items-center gap-2 font-semibold text-rejected-ink"><AlertTriangle className="size-5" aria-hidden />{t("gov.fraud_flags")}</p>
            <ul className="space-y-2">
              {app.flags.map((f) => (
                <li key={f.code} className="text-sm text-ink">
                  <span className="font-semibold">{t(`fraud.${f.code}`)}</span> <Badge tone={f.status === "open" ? "rejected" : f.status === "held" ? "review" : "approved"}>{t(`fraud.status_${f.status}`)}</Badge>
                  <br />{L(f.detail)}
                </li>
              ))}
            </ul>
          </Card>
        )}

        <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
          <div className="space-y-6">
            <Card as="section" className="p-6" aria-labelledby="cf-applicant">
              <h2 id="cf-applicant" className="mb-4 text-lg font-semibold">{t("gov.applicant")}</h2>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                {[
                  [t("apply.dob"), citizen ? `${formatDate(citizen.dob, lang)} (${ageFromDob(citizen.dob)})` : "—"],
                  [t("apply.gender"), citizen ? L(GENDERS[citizen.gender]) : "—"],
                  [t("apply.district"), `${app.district}, ${app.state}`],
                  [t("apply.income"), citizen ? formatINR(citizen.income) : "—"],
                  [t("apply.occupation"), citizen ? L(OCCUPATIONS[citizen.occupation]) : "—"],
                  [t("apply.category"), citizen ? L(SOCIAL_CATEGORIES[citizen.category]) : "—"],
                  ["Aadhaar", app.aadhaar],
                  [t("apply.account"), `${app.bankAccount} · ${app.ifsc}`],
                  [t("gov.submitted"), formatDate(app.submittedAt, lang, true)],
                ].map(([k, v]) => <div key={k}><dt className="text-muted">{k}</dt><dd className="num font-medium text-ink">{v}</dd></div>)}
              </dl>
              {scheme && scheme.fields.length > 0 && (
                <div className="mt-4 border-t border-line/[0.08] pt-4">
                  <h3 className="mb-2 text-sm font-semibold text-ink">{t("apply.step_questions")}</h3>
                  <dl className="grid gap-2 text-sm">
                    {scheme.fields.map((f) => <div key={f.id} className="flex justify-between gap-3"><dt className="text-muted">{L(f.label)}</dt><dd className="font-medium text-ink">{f.type === "yesno" ? t(`common.${app.answers[f.id] ?? "no"}`) : L(f.options?.find((o) => o.value === app.answers[f.id])?.label) || app.answers[f.id] || "—"}</dd></div>)}
                  </dl>
                </div>
              )}
            </Card>
            <Card as="section" className="p-6" aria-labelledby="cf-checks">
              <h2 id="cf-checks" className="mb-4 text-lg font-semibold">{t("gov.auto_checks")}</h2>
              <ul className="space-y-2">
                {app.autoChecks.map((c, i) => (
                  <m.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-3 text-sm">
                    <span className={cn("flex size-6 items-center justify-center rounded-full", c.ok ? "bg-approved/15 text-approved" : "bg-rejected/15 text-rejected")}>{c.ok ? <Check className="size-3.5" strokeWidth={3} aria-label={t("gov.passed")} /> : <X className="size-3.5" strokeWidth={3} aria-label={t("gov.failed")} />}</span>
                    <span className="text-ink">{L(c.label)}</span>
                  </m.li>
                ))}
              </ul>
            </Card>
          </div>

          <Card as="section" className="p-6" aria-labelledby="cf-docs">
            <h2 id="cf-docs" className="mb-4 text-lg font-semibold">{t("gov.documents")}</h2>
            <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto" role="tablist" aria-label={t("gov.documents")}>
              {app.documents.map((d) => (
                <button key={d.type} role="tab" aria-selected={activeDoc === d.type} onClick={() => setDocType(d.type)} className={cn("relative flex min-h-[40px] shrink-0 items-center gap-2 rounded-full px-3 text-sm font-semibold", activeDoc === d.type ? "text-primary-fg" : "text-ink hover:bg-ink/[0.05]")}>
                  {activeDoc === d.type && <m.span layoutId="doc-tab" className="absolute inset-0 rounded-full bg-primary" transition={spring.snappy} />}
                  <FileText className="relative size-4" aria-hidden /><span className="relative">{L(DOC_TYPES[d.type].label)}</span>
                </button>
              ))}
            </div>
            <div role="tabpanel" className="relative overflow-hidden rounded-card border border-line/[0.1] bg-ink/[0.03]">
              {doc ? (
                <DocThumb doc={doc} className="aspect-[16/10] w-full" />
              ) : (
                <div className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 text-center text-sm text-muted">
                  <FileText className="size-10" aria-hidden />
                  <p className="font-semibold text-ink">{app.documents.find((d) => d.type === activeDoc)?.name}</p>
                  <p>{t("gov.doc_specimen")}</p>
                </div>
              )}
              {activeDoc === "income" && app.flags.some((f) => f.code === "tampered_doc") && (
                <div className="absolute inset-x-4 top-4 rounded-input bg-rejected px-3 py-2 text-xs font-semibold text-white">{t("gov.tamper_overlay")}</div>
              )}
            </div>
          </Card>
        </div>

        {actionable ? (
          <div className="glass fixed inset-x-0 bottom-0 z-30 flex flex-wrap gap-2 border-t border-line/[0.08] p-3 pb-[calc(12px+env(safe-area-inset-bottom))] md:static md:mt-6 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
            <Button variant="success" size="lg" className="flex-1 md:flex-none" onClick={doRecommend} disabled={busy}><Check aria-hidden />{t("gov.recommend")}</Button>
            <Button variant="secondary" size="lg" className="flex-1 md:flex-none" onClick={() => { setErr(""); setAction("send_back"); }}><Undo2 aria-hidden />{t("gov.send_back")}</Button>
            <Button variant="danger" size="lg" className="flex-1 md:flex-none" onClick={() => { setErr(""); setAction("reject"); }}><Ban aria-hidden />{t("gov.reject")}</Button>
          </div>
        ) : (
          <p className="mt-6 rounded-input bg-ink/[0.04] p-4 text-sm text-body">{t("gov.not_actionable")}</p>
        )}

        <Sheet open={!!action} onOpenChange={(o) => !o && setAction(null)} title={action === "reject" ? t("gov.reject") : t("gov.send_back")} description={app.ref}
          footer={<div className="flex gap-2"><Button variant="secondary" className="flex-1" onClick={() => setAction(null)}>{t("common.cancel")}</Button><Button variant={action === "reject" ? "danger" : "primary"} className="flex-1" disabled={busy} onClick={doAction}>{t("common.confirm")}</Button></div>}>
          <Field label={action === "reject" ? t("gov.reason") : t("gov.comment")} htmlFor="cf-comment" error={err} hint={action === "reject" ? t("gov.reason_hint") : t("gov.comment_hint")} required>
            <Textarea id="cf-comment" value={comment} onChange={(e) => { setComment(e.target.value); setErr(""); }} autoFocus aria-invalid={!!err} />
          </Field>
          <div className="mt-3 flex flex-wrap gap-2">
            {(action === "reject" ? [t("gov.preset_r1"), t("gov.preset_r2")] : [t("gov.preset_s1"), t("gov.preset_s2")]).map((p) => (
              <button key={p} type="button" onClick={() => { setComment(p); setErr(""); }} className="rounded-full border border-line/[0.14] px-3 py-1.5 text-left text-xs font-medium text-ink hover:border-line/[0.3]">{p}</button>
            ))}
          </div>
        </Sheet>
        <span className="sr-only" aria-live="polite">{busy ? t("common.saving") : ""}</span>
      </m.div>
    </AnimatePresence>
  );
}
