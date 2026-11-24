import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, m } from "motion/react";
import { HandCoins, Check, Send, FileText, AlertTriangle, Download } from "lucide-react";
import { toast } from "sonner";
import { listRecommended, listBatches, createBatch, releaseBatch, getBatchApplicants } from "@/api/sanction";
import { listAllSchemes } from "@/api/schemes";
import { useOfficial } from "@/features/session";
import { useT } from "@/i18n";
import { PageHeader } from "@/components/Breadcrumbs";
import { Badge, Card, Select, Skeleton } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet } from "@/components/ui/sheet";
import { EmptyState } from "@/components/EmptyState";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { OfficialDocument } from "@/features/documents/OfficialDocument";
import { downloadOfficialPdf } from "@/features/documents/pdf";
import { compactINR, formatDate, formatINR, haptic, cn } from "@/lib/utils";
import { spring, ease, fadeUp } from "@/lib/motion";
import type { Batch } from "@/lib/types";

export default function Sanction() {
  const { t, L, lang } = useT();
  const { official } = useOfficial();
  const rec = useQuery({ queryKey: ["recommended"], queryFn: listRecommended });
  const batches = useQuery({ queryKey: ["batches"], queryFn: listBatches });
  const schemes = useQuery({ queryKey: ["all-schemes"], queryFn: listAllSchemes });
  const schemeIds = useMemo(() => [...new Set(rec.data?.map((a) => a.schemeId))], [rec.data]);
  const [schemeId, setSchemeId] = useState<string>("");
  const activeScheme = schemeId || schemeIds[0] || "";
  const scheme = schemes.data?.find((s) => s.id === activeScheme);
  const apps = (rec.data ?? []).filter((a) => a.schemeId === activeScheme);
  const byDistrict = useMemo(() => {
    const m = new Map<string, typeof apps>();
    apps.forEach((a) => m.set(`${a.district}, ${a.state}`, [...(m.get(`${a.district}, ${a.state}`) ?? []), a]));
    return [...m.entries()].sort();
  }, [apps]);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [releasing, setReleasing] = useState<Batch | null>(null);
  const [ticked, setTicked] = useState<Set<string>>(new Set());
  const [done, setDone] = useState(false);
  const [letter, setLetter] = useState<Batch | null>(null);

  const selectedApps = apps.filter((a) => sel.has(a.id));
  const total = selectedApps.reduce((s, a) => s + a.amount, 0);
  const remaining = scheme ? scheme.budget.total - scheme.budget.spent : 0;
  const pendingBatches = (batches.data ?? []).filter((b) => b.status === "created");
  const [names, setNames] = useState<Record<string, string>>({});
  const appName = (id: string) => names[id];

  const create = async () => {
    if (!official || !scheme || !selectedApps.length) return;
    if (total > remaining) return toast.error(t("san.over_budget"));
    try {
      const b = await createBatch(scheme.id, selectedApps.map((a) => a.id), official);
      setSel(new Set());
      haptic();
      toast.success(t("san.created", { ref: b.ref }));
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const release = async (b: Batch) => {
    if (!official) return;
    setNames(await getBatchApplicants(b.appIds));
    setReleasing(b);
    setTicked(new Set());
    setDone(false);
    await releaseBatch(b.id, official, (id) => { haptic(); setTicked((s) => new Set(s).add(id)); });
    setDone(true);
  };

  return (
    <div>
      <PageHeader title={t("san.title")} subtitle={t("san.sub")} crumbs={[{ label: t("gov.officials_portal") }, { label: t("gov.nav_sanction") }]} />

      {pendingBatches.length > 0 && (
        <section className="mb-8" aria-labelledby="pb">
          <h2 id="pb" className="mb-3 text-lg font-semibold">{t("san.ready")}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {pendingBatches.map((b) => {
              const sc = schemes.data?.find((s) => s.id === b.schemeId);
              return (
                <Card key={b.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{L(sc?.name)}</p>
                      <p className="num text-xs text-muted">{b.ref} · {formatDate(b.createdAt, lang)}</p>
                    </div>
                    <Badge tone="review" dot>{t("san.awaiting_release")}</Badge>
                  </div>
                  <p className="num mt-3 text-2xl font-bold text-ink">{formatINR(b.total)}</p>
                  <p className="text-sm text-muted">{t(b.appIds.length === 1 ? "san.beneficiaries_1" : "san.beneficiaries", { n: b.appIds.length })}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button onClick={() => release(b)}><Send aria-hidden />{t("san.release")}</Button>
                    <Button variant="ghost" onClick={() => setLetter(b)}><FileText aria-hidden />{t("san.letter")}</Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <section aria-labelledby="rec">
        <h2 id="rec" className="mb-3 text-lg font-semibold">{t("san.recommended")}</h2>
        {rec.isLoading ? <Skeleton className="h-64 rounded-card" /> : !rec.data?.length ? (
          <EmptyState title={t("san.empty")} body={t("san.empty_sub")} />
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
            <div>
              <div className="mb-4 max-w-sm">
                <label htmlFor="san-scheme" className="field-label">{t("san.scheme")}</label>
                <Select id="san-scheme" value={activeScheme} onChange={(e) => { setSchemeId(e.target.value); setSel(new Set()); }}>
                  {schemeIds.map((id) => <option key={id} value={id}>{L(schemes.data?.find((s) => s.id === id)?.name)} ({rec.data!.filter((a) => a.schemeId === id).length})</option>)}
                </Select>
              </div>
              <div className="space-y-4">
                {byDistrict.map(([district, list], gi) => {
                  const selectable = list.filter((a) => !a.blocked);
                  const all = selectable.length > 0 && selectable.every((a) => sel.has(a.id));
                  return (
                    <m.div key={district} variants={fadeUp} initial="hidden" animate="show" custom={gi}>
                      <Card className="overflow-hidden">
                        <label className="flex min-h-[52px] items-center gap-3 border-b border-line/[0.08] bg-ink/[0.03] px-4 font-semibold text-ink">
                          <Checkbox checked={all} disabled={!selectable.length} onCheckedChange={(v) => setSel((s) => { const n = new Set(s); selectable.forEach((a) => (v ? n.add(a.id) : n.delete(a.id))); return n; })} />
                          {district} <span className="num text-sm font-normal text-muted">· {list.length}</span>
                        </label>
                        <ul className="divide-y divide-line/[0.06]">
                          {list.map((a) => (
                            <li key={a.id}>
                              <label className={cn("flex min-h-[52px] items-center gap-3 px-4 py-2", a.blocked ? "opacity-70" : "cursor-pointer")}>
                                <Checkbox checked={sel.has(a.id)} disabled={a.blocked} onCheckedChange={(v) => setSel((s) => { const n = new Set(s); if (v) n.add(a.id); else n.delete(a.id); return n; })} />
                                <span className="min-w-0 flex-1">
                                  <span className="block font-medium text-ink">{a.applicantName}</span>
                                  <span className="num block text-xs text-muted">{a.ref}</span>
                                </span>
                                {a.blocked && <Badge tone="rejected"><AlertTriangle className="size-3" aria-hidden />{t("san.held")}</Badge>}
                                <span className="num font-semibold text-ink">{formatINR(a.amount)}</span>
                              </label>
                            </li>
                          ))}
                        </ul>
                      </Card>
                    </m.div>
                  );
                })}
              </div>
            </div>
            <aside className="xl:sticky xl:top-[96px] xl:self-start">
              <Card className="p-6">
                <h3 className="mb-4 flex items-center gap-2 text-base font-semibold"><HandCoins className="size-5" aria-hidden />{t("san.batch")}</h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between"><dt className="text-muted">{t("san.selected")}</dt><dd className="num font-semibold text-ink">{selectedApps.length}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted">{t("san.total")}</dt><dd className="num text-lg font-bold text-ink">{formatINR(total)}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted">{t("san.remaining")}</dt><dd className="num font-semibold text-ink">{compactINR(remaining, lang)}</dd></div>
                </dl>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink/[0.08]" aria-hidden>
                  <m.div className={cn("h-full origin-left rounded-full", total > remaining ? "bg-rejected" : "bg-primary")} animate={{ scaleX: scheme ? Math.min(1, (scheme.budget.spent + total) / scheme.budget.total) : 0 }} transition={spring.smooth} />
                </div>
                <p className="num mt-2 text-xs text-muted">{scheme && t("san.after_batch", { p: (((scheme.budget.spent + total) / scheme.budget.total) * 100).toFixed(1) })}</p>
                <Button size="lg" className="mt-6 w-full" disabled={!selectedApps.length} onClick={create}><Check aria-hidden />{t("san.create")}</Button>
              </Card>
            </aside>
          </div>
        )}
      </section>

      <section className="mt-8" aria-labelledby="hist">
        <h2 id="hist" className="mb-3 text-lg font-semibold">{t("san.history")}</h2>
        <Card className="divide-y divide-line/[0.08]">
          {(batches.data ?? []).filter((b) => b.status === "released").map((b) => (
            <div key={b.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{L(schemes.data?.find((s) => s.id === b.schemeId)?.name)}</p>
                <p className="num text-xs text-muted">{b.ref} · {b.releasedAt && formatDate(b.releasedAt, lang)}</p>
              </div>
              <span className="num font-semibold text-ink">{formatINR(b.total)}</span>
              <Badge tone="approved" dot>{t("san.released")}</Badge>
              <Button size="sm" variant="ghost" onClick={() => setLetter(b)}><FileText aria-hidden />{t("san.letter")}</Button>
            </div>
          ))}
        </Card>
      </section>

      <Sheet open={!!releasing} onOpenChange={(o) => { if (!o && done) setReleasing(null); }} title={t("san.releasing")} description={releasing?.ref}
        footer={done ? <Button className="w-full" onClick={() => setReleasing(null)}>{t("common.done")}</Button> : undefined}>
        {releasing && (
          <div>
            <p className="mb-4 text-3xl font-bold text-ink"><AnimatedNumber value={releasing.total * (ticked.size / releasing.appIds.length)} format={(n) => formatINR(n)} /></p>
            <ul className="space-y-2" aria-live="polite">
              {releasing.appIds.map((id) => (
                <li key={id} className="flex min-h-[44px] items-center gap-3 rounded-input border border-line/[0.08] px-3">
                  <span className="min-w-0 flex-1 font-medium text-ink">{appName(id) ?? id}</span>
                  <AnimatePresence mode="wait" initial={false}>
                    {ticked.has(id) ? (
                      <m.span key="c" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={spring.snappy}><Badge tone="approved"><Check className="size-3" aria-hidden />{t("san.credited")}</Badge></m.span>
                    ) : (
                      <m.span key="p" exit={{ opacity: 0 }} transition={{ duration: 0.15, ease: ease.out }}><Badge tone="neutral">{t("san.processing")}</Badge></m.span>
                    )}
                  </AnimatePresence>
                </li>
              ))}
            </ul>
            {done && <m.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-input bg-approved/10 p-3 text-sm font-semibold text-approved" role="status">{t("san.all_credited")}</m.p>}
          </div>
        )}
      </Sheet>

      <Sheet open={!!letter} onOpenChange={(o) => !o && setLetter(null)} title={t("san.letter")} wide footer={letter && (
        <Button className="w-full" onClick={() => downloadOfficialPdf({ title: "Sanction Order", refNo: letter.ref, date: letter.createdAt, rows: [{ label: "Scheme", value: schemes.data?.find((s) => s.id === letter.schemeId)?.name.en ?? "" }, { label: "Beneficiaries", value: String(letter.appIds.length) }, { label: "Total amount", value: formatINR(letter.total) }, { label: "Status", value: letter.status === "released" ? "Released" : "Sanctioned" }], signer: `${letter.createdBy}, Sanctioning Authority (demo)`, qrId: "san-qr", filename: `${letter.ref.replace(/\//g, "-")}.pdf` })}>
          <Download aria-hidden />{t("apply.download")}
        </Button>
      )}>
        {letter && (
          <OfficialDocument title="Sanction Order" titleHi="स्वीकृति आदेश" refNo={letter.ref} date={letter.createdAt} qrId="san-qr" signer={`${letter.createdBy}, Sanctioning Authority (demo)`}
            rows={[
              { label: "Scheme / योजना", value: schemes.data?.find((s) => s.id === letter.schemeId)?.name.en ?? "" },
              { label: "Beneficiaries / लाभार्थी", value: String(letter.appIds.length) },
              { label: "Total amount / कुल राशि", value: formatINR(letter.total) },
              { label: "Status / स्थिति", value: letter.status === "released" ? "Released" : "Sanctioned" },
            ]}>
            <p className="mt-4 text-sm text-[#5B6578]">Sanction is hereby accorded for payment of the above amount to the beneficiaries listed in batch {letter.ref}, subject to the scheme guidelines.</p>
          </OfficialDocument>
        )}
      </Sheet>
    </div>
  );
}
