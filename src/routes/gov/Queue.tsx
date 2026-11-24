import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { m, useAnimate, type PanInfo } from "motion/react";
import { AlertTriangle, Check, ChevronRight, Undo2, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { listQueue, recommend, sendBack, bulkRecommend } from "@/api/applications";
import { listSchemes } from "@/api/schemes";
import { useOfficial } from "@/features/session";
import { useT } from "@/i18n";
import { PageHeader } from "@/components/Breadcrumbs";
import { Badge, Card, Skeleton, Textarea, Field } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet } from "@/components/ui/sheet";
import { EmptyState } from "@/components/EmptyState";
import { PullToRefresh } from "@/components/PullToRefresh";
import { SlaBadge, isClean } from "@/features/gov/sla";
import { spring } from "@/lib/motion";
import { cn, haptic } from "@/lib/utils";
import type { Application } from "@/lib/types";

export default function Queue() {
  const { t, L } = useT();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { official } = useOfficial();
  const { data, isLoading } = useQuery({ queryKey: ["queue-do"], queryFn: listQueue });
  const schemes = useQuery({ queryKey: ["schemes"], queryFn: listSchemes });
  const [filter, setFilter] = useState<"all" | "clean" | "flagged">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sendBackFor, setSendBackFor] = useState<Application | null>(null);
  const [comment, setComment] = useState("");
  const [err, setErr] = useState("");
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const listRef = useRef<HTMLUListElement>(null);

  const rows = useMemo(
    () => (data ?? []).filter((a) => !hidden.has(a.id)).filter((a) => (filter === "clean" ? isClean(a) : filter === "flagged" ? !isClean(a) : true)),
    [data, filter, hidden],
  );
  const v = useWindowVirtualizer({ count: rows.length, estimateSize: () => 104, overscan: 6, scrollMargin: listRef.current?.offsetTop ?? 0 });
  const clean = rows.filter(isClean);
  const schemeName = (id: string) => L(schemes.data?.find((s) => s.id === id)?.name);

  const doRecommend = async (a: Application) => {
    if (!official) return;
    setHidden((h) => new Set(h).add(a.id));
    await recommend(a.id, official);
    toast.success(t("gov.recommended_toast", { ref: a.ref }));
  };

  const doSendBack = async () => {
    if (!sendBackFor || !official) return;
    if (comment.trim().length < 10) return setErr(t("gov.comment_required"));
    const a = sendBackFor;
    setSendBackFor(null);
    setHidden((h) => new Set(h).add(a.id));
    await sendBack(a.id, official, comment.trim());
    setComment("");
    toast.success(t("gov.sent_back_toast", { ref: a.ref }));
  };

  const doBulk = async () => {
    if (!official || selected.size === 0) return;
    const ids = [...selected];
    setHidden((h) => new Set([...h, ...ids]));
    setSelected(new Set());
    await bulkRecommend(ids, official);
    haptic(20);
    toast.success(t("gov.bulk_done", { n: ids.length }));
  };

  return (
    <PullToRefresh onRefresh={() => qc.invalidateQueries()}>
      <PageHeader title={t("gov.queue_title")} subtitle={t("gov.queue_sub")} crumbs={[{ label: t("gov.officials_portal") }, { label: t("gov.nav_queue") }]} />
      <div className="mb-4 grid grid-cols-3 gap-3">
        {[
          { k: "all", n: data?.length ?? 0, label: t("gov.f_all") },
          { k: "clean", n: (data ?? []).filter(isClean).length, label: t("gov.f_clean") },
          { k: "flagged", n: (data ?? []).filter((a) => !isClean(a)).length, label: t("gov.f_flagged") },
        ].map((f) => (
          <button key={f.k} onClick={() => setFilter(f.k as typeof filter)} aria-pressed={filter === f.k} className={cn("card relative p-4 text-left transition-colors", filter === f.k && "border-primary/40")}>
            {filter === f.k && <m.span layoutId="q-filter" className="absolute inset-0 rounded-card ring-2 ring-primary" transition={spring.snappy} />}
            <span className="num block text-2xl font-bold text-ink">{f.n}</span>
            <span className="block text-sm text-muted">{f.label}</span>
          </button>
        ))}
      </div>

      <Card className="mb-4 flex flex-wrap items-center gap-3 p-3">
        <label className="flex min-h-[44px] items-center gap-3 px-1 text-sm font-semibold text-ink">
          <Checkbox checked={clean.length > 0 && clean.every((a) => selected.has(a.id))} onCheckedChange={(v) => setSelected(v ? new Set(clean.map((a) => a.id)) : new Set())} label={t("gov.select_clean")} disabled={!clean.length} />
          {t("gov.select_clean")} <span className="num text-muted">({clean.length})</span>
        </label>
        <Button className="ml-auto" disabled={!selected.size} onClick={doBulk}><CheckCheck aria-hidden />{t("gov.bulk", { n: selected.size })}</Button>
      </Card>
      <p className="mb-3 hidden text-xs text-muted sm:block">{t("gov.keyboard_hint")}</p>
      <p className="mb-3 text-xs text-muted sm:hidden">{t("gov.swipe_hint")}</p>

      {isLoading ? (
        <div className="space-y-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-card" />)}</div>
      ) : rows.length === 0 ? (
        <EmptyState title={t("gov.queue_empty")} body={t("gov.queue_empty_sub")} />
      ) : (
        <ul ref={listRef} className="relative" style={{ height: v.getTotalSize() }} aria-label={t("gov.queue_title")}>
          {v.getVirtualItems().map((vi) => {
            const a = rows[vi.index];
            return (
              <li key={a.id} data-index={vi.index} ref={v.measureElement} className="absolute inset-x-0 pb-3" style={{ transform: `translateY(${vi.start - v.options.scrollMargin}px)` }}>
                <QueueRow
                  a={a}
                  scheme={schemeName(a.schemeId)}
                  selected={selected.has(a.id)}
                  onSelect={(val) => setSelected((s) => { const n = new Set(s); if (val) n.add(a.id); else n.delete(a.id); return n; })}
                  onOpen={() => nav(`/gov/case/${a.id}`)}
                  onRecommend={() => doRecommend(a)}
                  onSendBack={() => { setErr(""); setSendBackFor(a); }}
                />
              </li>
            );
          })}
        </ul>
      )}

      <Sheet open={!!sendBackFor} onOpenChange={(o) => !o && setSendBackFor(null)} title={t("gov.send_back")} description={sendBackFor?.ref}
        footer={<div className="flex gap-2"><Button variant="secondary" className="flex-1" onClick={() => setSendBackFor(null)}>{t("common.cancel")}</Button><Button className="flex-1" onClick={doSendBack}><Undo2 aria-hidden />{t("gov.send_back")}</Button></div>}>
        <Field label={t("gov.comment")} htmlFor="sb-comment" error={err} hint={t("gov.comment_hint")} required>
          <Textarea id="sb-comment" value={comment} onChange={(e) => { setComment(e.target.value); setErr(""); }} autoFocus aria-invalid={!!err} />
        </Field>
      </Sheet>
    </PullToRefresh>
  );
}

function QueueRow({ a, scheme, selected, onSelect, onOpen, onRecommend, onSendBack }: {
  a: Application; scheme: string; selected: boolean; onSelect: (v: boolean) => void; onOpen: () => void; onRecommend: () => void; onSendBack: () => void;
}) {
  const { t } = useT();
  const [scope, animate] = useAnimate();
  const clean = isClean(a);
  const onDragEnd = async (_: unknown, info: PanInfo) => {
    const dx = info.offset.x + info.velocity.x * 0.2;
    if (dx > 110 && clean) {
      haptic();
      await animate(scope.current, { x: "110%", opacity: 0 }, { duration: 0.25 });
      onRecommend();
    } else if (dx < -110) {
      haptic();
      animate(scope.current, { x: 0 }, spring.smooth);
      onSendBack();
    } else animate(scope.current, { x: 0 }, spring.smooth);
  };
  return (
    <div className="relative overflow-hidden rounded-card">
      <div aria-hidden className="absolute inset-0 flex items-center justify-between rounded-card px-6 text-sm font-semibold text-white">
        <span className={cn("flex items-center gap-2", clean ? "text-approved" : "text-muted")}><Check className="size-5" />{t("gov.recommend")}</span>
        <span className="flex items-center gap-2 text-review-ink">{t("gov.send_back")}<Undo2 className="size-5" /></span>
      </div>
      <m.div ref={scope} drag="x" dragDirectionLock dragConstraints={{ left: 0, right: 0 }} dragElastic={0.6} onDragEnd={onDragEnd} className="card relative flex touch-pan-y items-center gap-3 p-4">
        <div onPointerDown={(e) => e.stopPropagation()}>
          <Checkbox checked={selected} onCheckedChange={onSelect} disabled={!clean} label={t("gov.select_row", { ref: a.ref })} />
        </div>
        <button onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left" onKeyDown={(e) => { if (e.key === "r" && clean) onRecommend(); if (e.key === "b") onSendBack(); }}>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-ink">{a.applicantName}</p>
              {!clean && <Badge tone="rejected"><AlertTriangle className="size-3" aria-hidden />{t("gov.flagged")}</Badge>}
              <SlaBadge app={a} />
            </div>
            <p className="truncate text-sm text-body">{scheme}</p>
            <p className="num text-xs text-muted">{a.ref} · {a.district}, {a.state}</p>
          </div>
          <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
        </button>
      </m.div>
    </div>
  );
}
