import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, m } from "motion/react";
import { Check, Undo2, GitCompare } from "lucide-react";
import { toast } from "sonner";
import { listByStatus, approveScheme, sendBackScheme } from "@/api/schemes";
import { useOfficial } from "@/features/session";
import { useT } from "@/i18n";
import { PageHeader } from "@/components/Breadcrumbs";
import { Badge, Card, Field, Skeleton, Textarea } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { EmptyState } from "@/components/EmptyState";
import { describeRule } from "@/lib/eligibility";
import { CATEGORIES, DOC_TYPES, stateLabel } from "@/lib/reference";
import { compactINR, formatDate, formatINR, cn } from "@/lib/utils";
import { fadeUp, spring } from "@/lib/motion";
import type { Scheme } from "@/lib/types";

type Row = { label: string; before: string; after: string };

function summarise(s: Scheme, lang: "en" | "hi"): Record<string, string> {
  return {
    name: `${s.name.en} / ${s.name.hi}`,
    tagline: s.tagline[lang],
    level: s.level === "state" ? `State · ${stateLabel(s.state ?? "", lang)}` : "Central",
    category: CATEGORIES[s.category][lang],
    benefit: `${formatINR(s.benefitAmount)} (${s.benefitLabel[lang]})`,
    benefits: s.benefits.map((b) => b[lang]).join("\n"),
    rules: s.rules.map((r) => describeRule(r, lang)).join("\n"),
    fields: s.fields.map((f) => f.label[lang]).join("\n") || "—",
    documents: s.documents.map((d) => DOC_TYPES[d].label[lang]).join(", "),
    budget: compactINR(s.budget.total, lang),
    dates: `${formatDate(s.opens, lang)} – ${formatDate(s.closes, lang)}`,
  };
}

export default function Approvals() {
  const { t, L, lang } = useT();
  const { official } = useOfficial();
  const { data, isLoading } = useQuery({ queryKey: ["pending-schemes"], queryFn: () => listByStatus("pending_approval") });
  const [sel, setSel] = useState<string | null>(null);
  const [sendBack, setSendBack] = useState(false);
  const [comment, setComment] = useState("");
  const [err, setErr] = useState("");
  const current = data?.find((s) => s.id === sel) ?? data?.[0];

  const rows: Row[] = current
    ? (() => {
        const after = summarise(current, lang);
        const before = current.previous ? summarise(current.previous as Scheme, lang) : null;
        return Object.keys(after).map((k) => ({ label: t(`appr.f_${k}`), before: before ? before[k] : "", after: after[k] }));
      })()
    : [];
  const changed = rows.filter((r) => r.before !== r.after);

  const approve = async () => {
    if (!current || !official) return;
    await approveScheme(current.id, official);
    toast.success(t("appr.approved", { name: L(current.name) }));
    setSel(null);
  };
  const doSendBack = async () => {
    if (!current || !official) return;
    if (comment.trim().length < 10) return setErr(t("gov.comment_required"));
    await sendBackScheme(current.id, official, comment.trim());
    toast.success(t("appr.sent_back"));
    setSendBack(false);
    setComment("");
    setSel(null);
  };

  return (
    <div>
      <PageHeader title={t("appr.title")} subtitle={t("appr.sub")} crumbs={[{ label: t("gov.officials_portal") }, { label: t("gov.nav_approvals") }]} />
      {isLoading ? <Skeleton className="h-64 rounded-card" /> : !data?.length ? (
        <EmptyState title={t("appr.empty")} body={t("appr.empty_sub")} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <ul className="space-y-2" aria-label={t("appr.inbox")}>
            {data.map((s, i) => (
              <m.li key={s.id} variants={fadeUp} initial="hidden" animate="show" custom={i}>
                <button onClick={() => setSel(s.id)} aria-current={current?.id === s.id} className={cn("card relative w-full p-4 text-left", current?.id === s.id && "border-primary/40")}>
                  {current?.id === s.id && <m.span layoutId="appr-sel" className="absolute inset-0 rounded-card ring-2 ring-primary" transition={spring.snappy} />}
                  <p className="font-semibold text-ink">{L(s.name)}</p>
                  <p className="text-sm text-muted">{s.previous ? t("author.revision") : t("author.new_scheme")} · {formatDate(s.updatedAt, lang)}</p>
                </button>
              </m.li>
            ))}
          </ul>
          <AnimatePresence mode="wait">
            {current && (
              <m.div key={current.id} className="min-w-0" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={spring.smooth}>
                <Card className="p-6">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold">{L(current.name)}</h2>
                      <p className="text-sm text-muted">{L(current.department)}</p>
                    </div>
                    <Badge tone="info"><GitCompare className="size-3.5" aria-hidden />{current.previous ? t("appr.changes", { n: changed.length }) : t("appr.new")}</Badge>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-left text-sm">
                      <caption className="sr-only">{t("appr.diff")}</caption>
                      <thead>
                        <tr className="border-b border-line/[0.1]">
                          <th className="w-32 py-2 pr-3 font-semibold text-muted">{t("appr.field")}</th>
                          {current.previous && <th className="py-2 pr-3 font-semibold text-ink">{t("appr.before")}</th>}
                          <th className="py-2 font-semibold text-ink">{current.previous ? t("appr.after") : t("appr.proposed")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r) => {
                          const diff = !!current.previous && r.before !== r.after;
                          return (
                            <tr key={r.label} className="border-b border-line/[0.06] align-top">
                              <th scope="row" className="py-3 pr-3 font-medium text-muted">{r.label}{diff && <span className="sr-only"> ({t("appr.changed")})</span>}</th>
                              {current.previous && <td className={cn("whitespace-pre-line py-3 pr-3", diff ? "bg-rejected/[0.06] text-ink line-through decoration-rejected/50" : "text-body")}>{r.before}</td>}
                              <td className={cn("whitespace-pre-line py-3", diff ? "bg-approved/[0.08] font-medium text-ink" : "text-body")}>{r.after}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button variant="success" size="lg" onClick={approve}><Check aria-hidden />{t("appr.approve")}</Button>
                    <Button variant="secondary" size="lg" onClick={() => { setErr(""); setSendBack(true); }}><Undo2 aria-hidden />{t("gov.send_back")}</Button>
                  </div>
                </Card>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      )}
      <Sheet open={sendBack} onOpenChange={setSendBack} title={t("gov.send_back")} description={current ? L(current.name) : ""}
        footer={<div className="flex gap-2"><Button variant="secondary" className="flex-1" onClick={() => setSendBack(false)}>{t("common.cancel")}</Button><Button className="flex-1" onClick={doSendBack}>{t("gov.send_back")}</Button></div>}>
        <Field label={t("gov.comment")} htmlFor="ap-comment" error={err} hint={t("appr.comment_hint")} required>
          <Textarea id="ap-comment" value={comment} onChange={(e) => { setComment(e.target.value); setErr(""); }} autoFocus aria-invalid={!!err} />
        </Field>
      </Sheet>
    </div>
  );
}
