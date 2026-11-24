import * as Accordion from "@radix-ui/react-accordion";
import { m } from "motion/react";
import { Check, ChevronDown, FileText, CalendarDays, Gift, ShieldCheck, HelpCircle, Building2 } from "lucide-react";
import type { Scheme } from "@/lib/types";
import { useT } from "@/i18n";
import { describeRule } from "@/lib/eligibility";
import { DOC_TYPES } from "@/lib/reference";
import { formatDate, daysLeft, compactINR } from "@/lib/utils";
import { ease } from "@/lib/motion";
import { IconTint } from "@/components/ui/misc";

/** The citizen-facing body of a scheme. Shared by Scheme detail and the author's "Preview as citizen". */
export function SchemeBody({ s, delay = 0.18 }: { s: Scheme; delay?: number }) {
  const { t, L, lang } = useT();
  const section = (i: number) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: ease.out, delay: delay + i * 0.05 },
  });
  const left = daysLeft(s.closes);
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <m.section {...section(0)} className="card p-6" aria-labelledby="sec-about">
          <h2 id="sec-about" className="t-scale mb-2 text-xl font-semibold">{t("detail.about")}</h2>
          <p className="max-w-[70ch]">{L(s.description) || t("detail.no_desc")}</p>
          <p className="mt-4 flex items-center gap-2 text-sm text-muted"><Building2 className="size-4" aria-hidden /> {L(s.department)}</p>
        </m.section>

        <m.section {...section(1)} className="card p-6" aria-labelledby="sec-benefits">
          <h2 id="sec-benefits" className="t-scale mb-4 flex items-center gap-3 text-xl font-semibold"><IconTint size={36}><Gift className="size-4" aria-hidden /></IconTint>{t("detail.benefits")}</h2>
          <ul className="space-y-3">
            {s.benefits.filter((b) => b.en || b.hi).map((b, i) => (
              <li key={i} className="flex gap-3"><Check className="mt-1 size-4 shrink-0 text-approved" aria-hidden /><span className="text-ink">{L(b)}</span></li>
            ))}
          </ul>
        </m.section>

        <m.section {...section(2)} className="card p-6" aria-labelledby="sec-elig">
          <h2 id="sec-elig" className="t-scale mb-4 flex items-center gap-3 text-xl font-semibold"><IconTint size={36}><ShieldCheck className="size-4" aria-hidden /></IconTint>{t("detail.eligibility")}</h2>
          <ul className="space-y-3">
            {s.rules.map((r) => (
              <li key={r.id} className="flex gap-3"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-ink" aria-hidden /><span className="text-ink">{describeRule(r, lang)}</span></li>
            ))}
          </ul>
        </m.section>

        <m.section {...section(3)} className="card p-6" aria-labelledby="sec-docs">
          <h2 id="sec-docs" className="t-scale mb-4 flex items-center gap-3 text-xl font-semibold"><IconTint size={36}><FileText className="size-4" aria-hidden /></IconTint>{t("detail.documents")}</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {s.documents.map((d) => (
              <li key={d} className="flex items-center gap-3 rounded-input border border-line/[0.08] px-3 py-2.5 text-ink"><FileText className="size-4 text-muted" aria-hidden />{L(DOC_TYPES[d].label)}</li>
            ))}
          </ul>
        </m.section>

        {s.faqs.length > 0 && (
          <m.section {...section(4)} className="card p-6" aria-labelledby="sec-faq">
            <h2 id="sec-faq" className="t-scale mb-2 flex items-center gap-3 text-xl font-semibold"><IconTint size={36}><HelpCircle className="size-4" aria-hidden /></IconTint>{t("detail.faqs")}</h2>
            <Accordion.Root type="single" collapsible className="divide-y divide-line/[0.08]">
              {s.faqs.map((f, i) => (
                <Accordion.Item key={i} value={`f${i}`}>
                  <Accordion.Header>
                    <Accordion.Trigger className="group flex min-h-[52px] w-full items-center justify-between gap-4 py-3 text-left font-semibold text-ink">
                      {L(f.q)}
                      <ChevronDown className="size-5 shrink-0 text-muted transition-transform duration-300 group-data-[state=open]:rotate-180" aria-hidden />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content className="overflow-hidden pb-4 data-[state=open]:animate-none">
                    <p>{L(f.a)}</p>
                  </Accordion.Content>
                </Accordion.Item>
              ))}
            </Accordion.Root>
          </m.section>
        )}
      </div>

      <m.aside {...section(1)} className="space-y-4 lg:sticky lg:top-[112px] lg:self-start" aria-labelledby="sec-dates">
        <div className="card p-6">
          <h2 id="sec-dates" className="t-scale mb-4 flex items-center gap-3 text-lg font-semibold"><IconTint size={36}><CalendarDays className="size-4" aria-hidden /></IconTint>{t("detail.dates")}</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-muted">{t("detail.opens")}</dt><dd className="num font-semibold text-ink">{formatDate(s.opens, lang)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">{t("detail.closes")}</dt><dd className="num font-semibold text-ink">{formatDate(s.closes, lang)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">{t("detail.time_left")}</dt><dd className="num font-semibold text-ink">{left >= 0 ? t("detail.days", { n: left }) : t("scheme.closed")}</dd></div>
          </dl>
        </div>
        <div className="card p-6">
          <p className="text-sm text-muted">{t("detail.benefit")}</p>
          <p className="num mt-1 text-2xl font-bold text-ink">{L(s.benefitLabel)}</p>
          <div className="mt-4 border-t border-line/[0.08] pt-4 text-sm">
            <div className="flex justify-between"><span className="text-muted">{t("detail.budget")}</span><span className="num font-semibold text-ink">{compactINR(s.budget.total, lang)}</span></div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink/[0.08]">
              <m.div className="h-full origin-left rounded-full bg-primary" initial={{ scaleX: 0 }} animate={{ scaleX: Math.min(1, s.budget.spent / Math.max(1, s.budget.total)) }} transition={{ duration: 0.8, ease: ease.out, delay: delay + 0.2 }} />
            </div>
            <p className="num mt-2 text-xs text-muted">{t("detail.utilised", { p: Math.round((s.budget.spent / Math.max(1, s.budget.total)) * 100) })}</p>
          </div>
        </div>
      </m.aside>
    </div>
  );
}
