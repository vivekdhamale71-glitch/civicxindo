import { useRef, useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { Camera, Upload, Check } from "lucide-react";
import { addDoc, detectType } from "@/api/wallet";
import type { DocType, WalletDoc } from "@/lib/types";
import { DOC_TYPES } from "@/lib/reference";
import { useT } from "@/i18n";
import { useObjectUrl } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/misc";
import { spring, ease } from "@/lib/motion";
import { haptic, sleep } from "@/lib/utils";

/** Camera or file upload → scan line sweeps across → "Detected: Aadhaar card ✓" → saved to the wallet. */
export function Uploader({ ownerId, expected, onSaved, compact }: { ownerId: string; expected?: DocType; onSaved?: (d: WalletDoc) => void; compact?: boolean }) {
  const { t, L } = useT();
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<"idle" | "scanning" | "detected">("idle");
  const [type, setType] = useState<DocType>("other");
  const url = useObjectUrl(file && file.type.startsWith("image/") ? file : null);
  const reduce = useReducedMotion();

  const pick = async (f?: File | null) => {
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) {
      alert(t("wallet.too_big"));
      return;
    }
    setFile(f);
    setPhase("scanning");
    await sleep(reduce ? 300 : 1400);
    setType(detectType(f.name, expected));
    setPhase("detected");
    haptic();
  };

  const save = async () => {
    if (!file) return;
    const d = await addDoc(ownerId, file, file.name, type);
    haptic();
    setFile(null);
    setPhase("idle");
    onSaved?.(d);
  };

  return (
    <div>
      <input ref={fileRef} type="file" accept="image/*,application/pdf" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
      <input ref={camRef} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
      <AnimatePresence mode="wait" initial={false}>
        {phase === "idle" ? (
          <m.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className={compact ? "flex gap-2" : "grid grid-cols-2 gap-3"}>
            <Button variant="secondary" size={compact ? "sm" : "lg"} onClick={() => camRef.current?.click()} className={compact ? "" : "h-24 flex-col"}>
              <Camera aria-hidden /> {t("wallet.camera")}
            </Button>
            <Button variant="secondary" size={compact ? "sm" : "lg"} onClick={() => fileRef.current?.click()} className={compact ? "" : "h-24 flex-col"}>
              <Upload aria-hidden /> {t("wallet.file")}
            </Button>
          </m.div>
        ) : (
          <m.div key="preview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: ease.out }}>
            <div className="relative h-44 overflow-hidden rounded-card border border-line/[0.1] bg-ink/[0.04]" style={{ ["--scan-h" as string]: "176px" }}>
              {url ? <img src={url} alt={t("wallet.preview")} className="h-full w-full object-contain" /> : <div className="flex h-full items-center justify-center text-sm font-semibold text-ink">{file?.name}</div>}
              {phase === "scanning" && !reduce && (
                <m.div
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-10"
                  style={{ background: "linear-gradient(180deg, transparent, rgb(var(--info) / .25) 80%, rgb(var(--info)) 100%)" }}
                  initial={{ y: -40 }}
                  animate={{ y: 176 }}
                  transition={{ duration: 1.3, ease: "easeInOut" }}
                />
              )}
            </div>
            <div className="mt-3 min-h-[36px]" aria-live="polite">
              {phase === "scanning" ? (
                <p className="text-sm text-muted">{t("wallet.scanning")}</p>
              ) : (
                <m.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={spring.snappy} className="inline-flex items-center gap-1.5 rounded-full bg-approved/10 px-3 py-1 text-sm font-semibold text-approved">
                  {t("wallet.detected", { type: L(DOC_TYPES[type].label) })} <Check className="size-4" aria-hidden />
                </m.span>
              )}
            </div>
            {phase === "detected" && (
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label htmlFor="doc-type" className="field-label">{t("wallet.type")}</label>
                  <Select id="doc-type" value={type} onChange={(e) => setType(e.target.value as DocType)}>
                    {(Object.keys(DOC_TYPES) as DocType[]).map((d) => <option key={d} value={d}>{L(DOC_TYPES[d].label)}</option>)}
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => { setFile(null); setPhase("idle"); }}>{t("common.cancel")}</Button>
                  <Button onClick={save}>{t("wallet.save")}</Button>
                </div>
              </div>
            )}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
