import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download } from "lucide-react";
import { openData } from "@/api/stats";
import { useT } from "@/i18n";
import { useSettings } from "@/store/settings";
import { PageHeader } from "@/components/Breadcrumbs";
import { Card, Skeleton } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { Reveal } from "@/components/Reveal";
import { compactINR, formatDate, groupIN } from "@/lib/utils";
import { STAGE_LABELS } from "@/lib/reference";

/** Reads theme tokens so charts follow light / dark / high-contrast (SVG attributes can't use CSS variables). */
function useChartColors() {
  const theme = useSettings((s) => s.theme);
  const contrast = useSettings((s) => s.contrast);
  return useMemo(() => {
    const cs = getComputedStyle(document.documentElement);
    const rgb = (v: string, a = 1) => `rgba(${cs.getPropertyValue(v).trim().split(/\s+/).join(",")},${a})`;
    return { mark: theme === "dark" && contrast !== "high" ? rgb("--info") : rgb("--primary"), grid: rgb("--line", 0.08), axis: rgb("--muted"), card: rgb("--card"), ink: rgb("--ink") };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, contrast]);
}

export default function OpenData() {
  const { t, L, lang } = useT();
  const c = useChartColors();
  const { data, isLoading } = useQuery({ queryKey: ["open-data"], queryFn: openData });

  const tooltip = {
    cursor: { fill: c.grid },
    contentStyle: { background: c.card, border: `1px solid ${c.grid}`, borderRadius: 12, color: c.ink, boxShadow: "0 8px 24px -8px rgba(27,42,74,.2)" },
    labelStyle: { color: c.ink, fontWeight: 600 },
    itemStyle: { color: c.ink },
  };
  const axis = { stroke: c.axis, fontSize: 12, tickLine: false, axisLine: false };

  const csv = () => {
    if (!data) return;
    const lines = ["scheme,beneficiaries,disbursed_inr,budget_inr", ...data.byScheme.map((s) => `"${s.name.en}",${s.beneficiaries},${s.spent},${s.total}`)];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    a.download = "civicxindo-open-data.csv";
    a.click();
  };

  if (isLoading || !data)
    return (
      <div>
        <Skeleton className="mb-6 h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-card" />)}</div>
        <Skeleton className="mt-6 h-80 rounded-card" />
      </div>
    );

  const schemeRows = data.byScheme.map((s) => ({ name: s.code, full: L(s.name), value: s.spent }));
  const stateRows = data.byState.slice(0, 10).map((s) => ({ name: lang === "hi" ? s.hi : s.state, value: s.beneficiaries }));
  const monthRows = data.months.map((m) => ({ name: lang === "hi" ? m.monthHi : m.month, value: m.amount }));
  const stageRows = data.byStage.map((s) => ({ name: L(STAGE_LABELS[s.stage as keyof typeof STAGE_LABELS]), value: s.count }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("od.title")}
        subtitle={t("od.sub")}
        crumbs={[{ label: t("nav.open_data") }]}
        actions={<Button variant="secondary" onClick={csv}><Download aria-hidden />{t("od.csv")}</Button>}
      />
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: t("od.total_ben"), value: data.totalBen, fmt: groupIN },
          { label: t("od.total_spent"), value: data.totalSpent, fmt: (n: number) => compactINR(n, lang) },
          { label: t("od.schemes"), value: data.byScheme.length, fmt: groupIN },
        ].map((k, i) => (
          <Reveal key={k.label} i={i}>
            <Card className="p-6">
              <p className="text-sm text-muted">{k.label}</p>
              <p className="mt-1 text-[28px] font-bold text-ink"><AnimatedNumber value={k.value} format={k.fmt} /></p>
            </Card>
          </Reveal>
        ))}
      </div>

      <ChartCard title={t("od.by_scheme")} rows={schemeRows.map((r) => [r.full, compactINR(r.value, lang)])} cols={[t("od.scheme"), t("od.disbursed")]}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={schemeRows} margin={{ top: 8, right: 8, left: 8, bottom: 0 }} barCategoryGap={6}>
            <CartesianGrid vertical={false} stroke={c.grid} />
            <XAxis dataKey="name" {...axis} />
            <YAxis {...axis} width={64} tickFormatter={(v) => compactINR(v, lang).replace(/ (crore|करोड़)/, "Cr").replace(/ (lakh|लाख)/, "L")} />
            <Tooltip {...tooltip} formatter={(v: number) => [compactINR(v, lang), t("od.disbursed")]} labelFormatter={(l, p) => p?.[0]?.payload?.full ?? l} />
            <Bar dataKey="value" fill={c.mark} radius={[4, 4, 0, 0]} maxBarSize={36} animationDuration={700} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title={t("od.by_state")} rows={stateRows.map((r) => [r.name, groupIN(r.value)])} cols={[t("od.state"), t("od.beneficiaries")]}>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={stateRows} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }} barCategoryGap={4}>
              <CartesianGrid horizontal={false} stroke={c.grid} />
              <XAxis type="number" {...axis} tickFormatter={(v) => (v >= 1e5 ? `${(v / 1e5).toFixed(0)}L` : groupIN(v))} />
              <YAxis type="category" dataKey="name" {...axis} width={110} />
              <Tooltip {...tooltip} formatter={(v: number) => [groupIN(v), t("od.beneficiaries")]} />
              <Bar dataKey="value" fill={c.mark} radius={[0, 4, 4, 0]} maxBarSize={22} animationDuration={700} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title={t("od.by_month")} rows={monthRows.map((r) => [r.name, compactINR(r.value, lang)])} cols={[t("od.month"), t("od.disbursed")]}>
          <ResponsiveContainer width="100%" height={340}>
            <AreaChart data={monthRows} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="od-area" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={c.mark} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={c.mark} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={c.grid} />
              <XAxis dataKey="name" {...axis} />
              <YAxis {...axis} width={64} tickFormatter={(v) => compactINR(v, lang).replace(/ (crore|करोड़)/, "Cr")} />
              <Tooltip {...tooltip} cursor={{ stroke: c.axis, strokeDasharray: "3 3" }} formatter={(v: number) => [compactINR(v, lang), t("od.disbursed")]} />
              <Area type="monotone" dataKey="value" stroke={c.mark} strokeWidth={2} fill="url(#od-area)" activeDot={{ r: 5, strokeWidth: 2, stroke: c.card }} animationDuration={900} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title={t("od.pipeline")} rows={stageRows.map((r) => [r.name, String(r.value)])} cols={[t("od.stage"), t("od.applications")]}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={stageRows} margin={{ top: 8, right: 8, left: 8, bottom: 0 }} barCategoryGap={8}>
            <CartesianGrid vertical={false} stroke={c.grid} />
            <XAxis dataKey="name" {...axis} interval={0} fontSize={11} />
            <YAxis {...axis} width={32} allowDecimals={false} />
            <Tooltip {...tooltip} formatter={(v: number) => [v, t("od.applications")]} />
            <Bar dataKey="value" fill={c.mark} radius={[4, 4, 0, 0]} maxBarSize={48} animationDuration={700} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <p className="text-xs text-muted">{t("od.note", { d: formatDate(data.updated, lang, true) })}</p>
    </div>
  );
}

function ChartCard({ title, children, rows, cols }: { title: string; children: React.ReactNode; rows: string[][]; cols: string[] }) {
  const { t } = useT();
  return (
    <Reveal>
      <Card as="section" className="p-4 md:p-6" aria-label={title}>
        <h2 className="t-scale mb-4 text-lg font-semibold">{title}</h2>
        <div aria-hidden>{children}</div>
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer py-2 font-semibold text-info">{t("od.table")}</summary>
          <div className="max-h-72 overflow-auto">
            <table className="w-full text-left">
              <thead><tr className="border-b border-line/[0.1]">{cols.map((c) => <th key={c} className="py-2 pr-4 font-semibold text-ink">{c}</th>)}</tr></thead>
              <tbody>{rows.map((r, i) => <tr key={i} className="border-b border-line/[0.06]">{r.map((v, j) => <td key={j} className="num py-2 pr-4">{v}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </details>
      </Card>
    </Reveal>
  );
}
