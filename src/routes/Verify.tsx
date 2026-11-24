import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, m } from "motion/react";
import { ShieldCheck, ShieldX, ScanLine, Search } from "lucide-react";
import { toast } from "sonner";
import { verifyReference } from "@/api/applications";
import { useT } from "@/i18n";
import { PageHeader } from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, Field, Input } from "@/components/ui/misc";
import { formatDate } from "@/lib/utils";
import { spring } from "@/lib/motion";
import { STAGE_LABELS } from "@/lib/reference";

type Detector = { detect: (src: ImageBitmapSource) => Promise<{ rawValue: string }[]> };

export default function Verify() {
  const { t, L, lang } = useT();
  const [params, setParams] = useSearchParams();
  const [ref, setRef] = useState(params.get("ref") ?? "");
  const camRef = useRef<HTMLInputElement>(null);
  const v = useMutation({ mutationFn: (r: string) => verifyReference(r) });

  useEffect(() => {
    const r = params.get("ref");
    if (r) v.mutate(r);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = (r: string) => {
    if (!r.trim()) return;
    setParams({ ref: r.trim() }, { replace: true });
    v.mutate(r);
  };

  const scan = async (file?: File) => {
    if (!file) return;
    const BD = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => Detector }).BarcodeDetector;
    if (!BD) return toast.error(t("verify.no_scanner"));
    try {
      const bmp = await createImageBitmap(file);
      const codes = await new BD({ formats: ["qr_code"] }).detect(bmp);
      const raw = codes[0]?.rawValue;
      if (!raw) return toast.error(t("verify.no_code"));
      const found = (() => { try { return new URL(raw).searchParams.get("ref") ?? raw; } catch { return raw; } })();
      setRef(found);
      run(found);
    } catch {
      toast.error(t("verify.no_code"));
    }
  };

  const res = v.data;
  const statusLabel = (s: string) => (s in STAGE_LABELS ? L(STAGE_LABELS[s as keyof typeof STAGE_LABELS]) : t(`verify.status_${s}`));

  return (
    <div className="mx-auto max-w-[640px]">
      <PageHeader title={t("verify.title")} subtitle={t("verify.sub")} crumbs={[{ label: t("verify.title") }]} />
      <Card className="p-6">
        <form onSubmit={(e) => { e.preventDefault(); run(ref); }} className="space-y-4">
          <Field label={t("verify.ref")} htmlFor="v-ref" hint={t("verify.ref_hint")}>
            <Input id="v-ref" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="CXI/2026/VSS/001041" className="num uppercase" autoComplete="off" />
          </Field>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" size="lg" className="flex-1" disabled={v.isPending}><Search aria-hidden />{v.isPending ? t("verify.checking") : t("verify.check")}</Button>
            <Button type="button" size="lg" variant="secondary" onClick={() => camRef.current?.click()}><ScanLine aria-hidden />{t("verify.scan")}</Button>
          </div>
          <input ref={camRef} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => { scan(e.target.files?.[0]); e.target.value = ""; }} />
        </form>
      </Card>

      <div aria-live="polite" className="mt-6">
        <AnimatePresence mode="wait">
          {v.isSuccess && (
            <m.div key={res ? res.ref : "none"} initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} transition={spring.smooth}>
              {res ? (
                <Card className="overflow-hidden border-approved/30">
                  <div className="flex items-center gap-3 bg-approved/10 p-4">
                    <m.span initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ ...spring.snappy, delay: 0.1 }}><ShieldCheck className="size-8 text-approved" aria-hidden /></m.span>
                    <div>
                      <p className="text-lg font-bold text-approved">{t("verify.genuine")} ✓</p>
                      <p className="text-sm text-ink">{t(`verify.kind_${res.kind}`)}</p>
                    </div>
                  </div>
                  <dl className="grid gap-3 p-4 text-sm sm:grid-cols-2">
                    <div><dt className="text-muted">{t("verify.ref")}</dt><dd className="num font-semibold text-ink">{res.ref}</dd></div>
                    <div><dt className="text-muted">{t("verify.date")}</dt><dd className="num font-semibold text-ink">{formatDate(res.date, lang)}</dd></div>
                    <div><dt className="text-muted">{t("verify.scheme")}</dt><dd className="font-semibold text-ink">{L(res.schemeName)}</dd></div>
                    <div><dt className="text-muted">{t("verify.issued_to")}</dt><dd className="font-semibold text-ink">{res.issuedTo}</dd></div>
                    <div><dt className="text-muted">{t("verify.status")}</dt><dd className="font-semibold text-ink">{statusLabel(res.status)}</dd></div>
                  </dl>
                </Card>
              ) : (
                <Card className="flex items-center gap-3 border-rejected/30 bg-rejected/[0.06] p-4">
                  <ShieldX className="size-8 text-rejected" aria-hidden />
                  <div>
                    <p className="text-lg font-bold text-rejected-ink">{t("verify.not_found")} ✕</p>
                    <p className="text-sm text-ink">{t("verify.not_found_sub")}</p>
                  </div>
                </Card>
              )}
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
