import { QRCodeCanvas } from "qrcode.react";
import { BadgeCheck } from "lucide-react";
import { Wheel } from "@/components/brand/Wheel";
import { appUrl, formatDate } from "@/lib/utils";

export interface DocRow {
  label: string;
  value: string;
}

/** Official document layout: letterhead, reference, date, QR, digital signature box, mark watermark. */
export function OfficialDocument({
  title, titleHi, refNo, date, rows, signer, qrId, children,
}: { title: string; titleHi: string; refNo: string; date: string; rows: DocRow[]; signer: string; qrId: string; children?: React.ReactNode }) {
  const verifyUrl = appUrl(`/verify?ref=${encodeURIComponent(refNo)}`);
  return (
    <article className="relative overflow-hidden rounded-card border border-line/[0.12] bg-white text-[#1B2A4A] shadow-card" aria-label={title}>
      <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center text-[#1B2A4A] opacity-[0.045]">
        <Wheel size={360} strokeWidth={1} />
      </div>
      <header className="relative flex items-center gap-4 px-6 pb-4 pt-6">
        <span className="flex size-12 items-center justify-center rounded-full bg-[#1B2A4A]/[0.06]"><Wheel size={36} /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5B6578]">Government of India (demo) · <span lang="hi">भारत सरकार (डेमो)</span></p>
          <p className="text-lg font-bold">civicXindo</p>
          <p className="text-xs text-[#5B6578]">National Welfare Schemes Portal | <span lang="hi">राष्ट्रीय कल्याण योजना पोर्टल</span></p>
        </div>
      </header>
      <div className="tricolour relative" aria-hidden />
      <div className="relative px-6 py-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4 text-sm">
          <div>
            <p className="text-[#5B6578]">Reference no. / <span lang="hi">संदर्भ संख्या</span></p>
            <p className="num font-semibold">{refNo}</p>
          </div>
          <div className="text-right">
            <p className="text-[#5B6578]">Date / <span lang="hi">दिनांक</span></p>
            <p className="num font-semibold">{formatDate(date, "en", true)}</p>
          </div>
        </div>
        <h2 className="text-center text-xl font-bold text-[#1B2A4A]">{title}</h2>
        <p lang="hi" className="mb-6 text-center text-base font-semibold text-[#1B2A4A]/80">{titleHi}</p>
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          {rows.map((r) => (
            <div key={r.label} className="border-b border-dashed border-[#1B2A4A]/15 pb-2">
              <dt className="text-xs text-[#5B6578]">{r.label}</dt>
              <dd className="num font-semibold">{r.value}</dd>
            </div>
          ))}
        </dl>
        {children}
        <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-[#1B2A4A]/10 bg-white p-1.5">
              <QRCodeCanvas id={qrId} value={verifyUrl} size={96} level="M" marginSize={0} fgColor="#1B2A4A" />
            </div>
            <p className="max-w-[18ch] text-xs text-[#5B6578]">Scan to verify at civicXindo / <span lang="hi">सत्यापन हेतु स्कैन करें</span></p>
          </div>
          <div className="rounded-input border-2 border-[#15803D]/50 bg-[#15803D]/[0.06] px-4 py-3 text-xs">
            <p className="flex items-center gap-1.5 font-bold text-[#15803D]"><BadgeCheck className="size-4" aria-hidden /> Digitally signed / <span lang="hi">डिजिटल हस्ताक्षरित</span></p>
            <p className="mt-1 text-[#1B2A4A]">{signer}</p>
            <p className="num text-[#5B6578]">{formatDate(date, "en", true)}</p>
          </div>
        </div>
        <p className="mt-6 border-t border-[#1B2A4A]/10 pt-3 text-center text-[10px] text-[#5B6578]">Demo prototype – not an official government document. Computer-generated; no physical signature required.</p>
      </div>
    </article>
  );
}
