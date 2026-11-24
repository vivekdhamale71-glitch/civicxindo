import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AnimatePresence, m } from "motion/react";
import { Trash2, Eye, ShieldCheck, WifiOff, Share2 } from "lucide-react";
import { toast } from "sonner";
import { listDocs, deleteDoc, updateDocType, expiryState } from "@/api/wallet";
import { useSession } from "@/store/session";
import { RequireCitizen } from "@/features/RequireCitizen";
import { useT } from "@/i18n";
import { PageHeader } from "@/components/Breadcrumbs";
import { Uploader } from "@/features/wallet/Uploader";
import { DocThumb } from "@/features/wallet/DocThumb";
import { Badge, Card, Select, Skeleton } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { EmptyState } from "@/components/EmptyState";
import { DOC_TYPES } from "@/lib/reference";
import { formatDate } from "@/lib/utils";
import { fadeUp, spring } from "@/lib/motion";
import type { DocType, WalletDoc } from "@/lib/types";

export default function Wallet() {
  const { t } = useT();
  return (
    <RequireCitizen title={t("wallet.title")}>
      <Inner />
    </RequireCitizen>
  );
}

function Inner() {
  const { t, L, lang } = useT();
  const id = useSession((s) => s.citizenId)!;
  const { data, isLoading } = useQuery({ queryKey: ["wallet", id], queryFn: () => listDocs(id) });
  const [view, setView] = useState<WalletDoc | null>(null);
  const [confirm, setConfirm] = useState<WalletDoc | null>(null);
  const del = useMutation({ mutationFn: (d: WalletDoc) => deleteDoc(d.id), onSuccess: () => { setConfirm(null); setView(null); toast.success(t("wallet.deleted")); } });

  const warnings = data?.filter((d) => ["soon", "expired"].includes(expiryState(d))) ?? [];

  return (
    <div>
      <PageHeader title={t("wallet.title")} subtitle={t("wallet.sub")} crumbs={[{ label: t("wallet.title") }]} />
      <div className="mb-6 flex flex-wrap gap-2 text-sm">
        <Badge tone="approved"><ShieldCheck className="size-3.5" aria-hidden /> {t("wallet.on_device")}</Badge>
        <Badge tone="info"><WifiOff className="size-3.5" aria-hidden /> {t("wallet.offline")}</Badge>
      </div>

      <Card className="mb-6 p-6">
        <h2 className="mb-1 text-lg font-semibold">{t("wallet.add")}</h2>
        <p className="mb-4 text-sm text-muted">{t("wallet.add_sub")}</p>
        <Uploader ownerId={id} onSaved={() => toast.success(t("wallet.saved"))} />
      </Card>

      <AnimatePresence>
        {warnings.length > 0 && (
          <m.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 rounded-card border border-review/30 bg-review/10 p-4" role="status">
            <p className="font-semibold text-ink">{t("wallet.attention")}</p>
            <ul className="mt-1 text-sm text-ink">
              {warnings.map((d) => <li key={d.id}>{L(DOC_TYPES[d.type].label)}: {expiryState(d) === "expired" ? t("wallet.expired_on", { d: formatDate(d.expiresAt!, lang) }) : t("wallet.expires_on", { d: formatDate(d.expiresAt!, lang) })}</li>)}
            </ul>
          </m.div>
        )}
      </AnimatePresence>

      <h2 className="mb-3 text-lg font-semibold">{t("wallet.my_docs")} <span className="num text-muted">({data?.length ?? 0})</span></h2>
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-56 rounded-card" />)}</div>
      ) : !data?.length ? (
        <EmptyState title={t("wallet.empty")} body={t("wallet.empty_sub")} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence initial={false}>
            {data.map((d, i) => {
              const exp = expiryState(d);
              return (
                <m.li key={d.id} layout variants={fadeUp} initial="hidden" animate="show" exit={{ opacity: 0, scale: 0.96 }} custom={i} transition={spring.smooth}>
                  <Card className="overflow-hidden">
                    <button onClick={() => setView(d)} className="block w-full" aria-label={t("wallet.view", { name: d.name })}>
                      <DocThumb doc={d} className="aspect-[16/10] w-full rounded-none" />
                    </button>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-ink">{L(DOC_TYPES[d.type].label)}</p>
                        {exp === "expired" ? <Badge tone="rejected">{t("wallet.expired")}</Badge> : exp === "soon" ? <Badge tone="review">{t("wallet.expiring")}</Badge> : exp === "valid" ? <Badge tone="approved">{t("wallet.valid")}</Badge> : null}
                      </div>
                      <p className="truncate text-sm text-muted">{d.name}</p>
                      <p className="num mt-1 text-xs text-muted">{t("wallet.added", { d: formatDate(d.addedAt, lang) })}{d.expiresAt && ` · ${t("wallet.valid_till", { d: formatDate(d.expiresAt, lang) })}`}</p>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setView(d)}><Eye aria-hidden />{t("common.view")}</Button>
                        <Button size="sm" variant="ghost" onClick={() => setConfirm(d)} aria-label={t("wallet.delete_label", { name: d.name })}><Trash2 aria-hidden />{t("common.delete")}</Button>
                      </div>
                    </div>
                  </Card>
                </m.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      <Sheet open={!!view} onOpenChange={(v) => !v && setView(null)} title={view ? L(DOC_TYPES[view.type].label) : ""} description={view?.name} wide>
        {view && (
          <div className="space-y-4">
            <DocThumb doc={view} className="max-h-[50vh] w-full" />
            <div>
              <label htmlFor="type-change" className="field-label">{t("wallet.type")}</label>
              <Select id="type-change" value={view.type} onChange={async (e) => { await updateDocType(view.id, e.target.value as DocType); setView({ ...view, type: e.target.value as DocType }); }}>
                {(Object.keys(DOC_TYPES) as DocType[]).map((x) => <option key={x} value={x}>{L(DOC_TYPES[x].label)}</option>)}
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={async () => {
                const file = new File([view.blob], view.name, { type: view.mime });
                if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: view.name }).catch(() => undefined);
                else { const u = URL.createObjectURL(view.blob); const a = document.createElement("a"); a.href = u; a.download = view.name; a.click(); setTimeout(() => URL.revokeObjectURL(u), 1000); }
              }}><Share2 aria-hidden />{t("common.share")}</Button>
              <Button variant="ghost" onClick={() => setConfirm(view)}><Trash2 aria-hidden />{t("common.delete")}</Button>
            </div>
          </div>
        )}
      </Sheet>
      <Sheet open={!!confirm} onOpenChange={(v) => !v && setConfirm(null)} title={t("wallet.confirm_delete")} description={t("wallet.confirm_delete_sub")}
        footer={<div className="flex gap-2"><Button variant="secondary" className="flex-1" onClick={() => setConfirm(null)}>{t("common.cancel")}</Button><Button variant="danger" className="flex-1" onClick={() => confirm && del.mutate(confirm)}>{t("common.delete")}</Button></div>}>
        <p className="text-ink">{confirm?.name}</p>
      </Sheet>
    </div>
  );
}
