import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { Download, Search } from "lucide-react";
import { listAudit } from "@/api/admin";
import { useT } from "@/i18n";
import { useDebounced } from "@/lib/hooks";
import { PageHeader } from "@/components/Breadcrumbs";
import { Card, Select, Skeleton } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { formatDate } from "@/lib/utils";

export default function Audit() {
  const { t, lang } = useT();
  const { data, isLoading } = useQuery({ queryKey: ["audit"], queryFn: listAudit });
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [action, setAction] = useState("");
  const dq = useDebounced(q, 120);
  const listRef = useRef<HTMLDivElement>(null);

  const roles = useMemo(() => [...new Set(data?.map((e) => e.role))].sort(), [data]);
  const actions = useMemo(() => [...new Set(data?.map((e) => e.action))].sort(), [data]);
  const rows = useMemo(() => {
    const s = dq.trim().toLowerCase();
    return (data ?? []).filter((e) => (!role || e.role === role) && (!action || e.action === action) && (!s || `${e.actor} ${e.target} ${e.detail ?? ""}`.toLowerCase().includes(s)));
  }, [data, dq, role, action]);
  const v = useWindowVirtualizer({ count: rows.length, estimateSize: () => 64, overscan: 10, scrollMargin: listRef.current?.offsetTop ?? 0 });

  const csv = () => {
    const lines = ["time,actor,role,action,target,detail", ...rows.map((e) => [e.at, e.actor, e.role, e.action, e.target, e.detail ?? ""].map((x) => `"${String(x).replace(/"/g, '""')}"`).join(","))];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    a.download = "civicxindo-audit-log.csv";
    a.click();
  };

  return (
    <div>
      <PageHeader title={t("audit.title")} subtitle={t("audit.sub")} crumbs={[{ label: t("gov.officials_portal") }, { label: t("gov.nav_audit") }]} actions={<Button variant="secondary" onClick={csv}><Download aria-hidden />{t("od.csv")}</Button>} />
      <Card className="mb-4 grid gap-3 p-4 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="relative">
          <label htmlFor="au-q" className="sr-only">{t("audit.search")}</label>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted" aria-hidden />
          <input id="au-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("audit.search")} className="input pl-11" />
        </div>
        <Select aria-label={t("audit.role")} value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">{t("audit.all_roles")}</option>
          {roles.map((r) => <option key={r} value={r}>{r}</option>)}
        </Select>
        <Select aria-label={t("audit.action")} value={action} onChange={(e) => setAction(e.target.value)}>
          <option value="">{t("audit.all_actions")}</option>
          {actions.map((a) => <option key={a} value={a}>{t(`act.${a}`)}</option>)}
        </Select>
      </Card>
      <p className="num mb-2 text-sm text-muted" aria-live="polite">{t("audit.count", { n: rows.length })}</p>
      {isLoading ? <Skeleton className="h-96 rounded-card" /> : rows.length === 0 ? <EmptyState title={t("audit.empty")} /> : (
        <Card className="overflow-hidden">
          <div className="hidden grid-cols-[150px_1fr_1fr_1.2fr] gap-3 border-b border-line/[0.08] bg-ink/[0.03] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted md:grid" aria-hidden>
            <span>{t("audit.when")}</span><span>{t("audit.who")}</span><span>{t("audit.what")}</span><span>{t("audit.target")}</span>
          </div>
          <div ref={listRef} role="table" aria-label={t("audit.title")} aria-rowcount={rows.length} className="relative" style={{ height: v.getTotalSize() }}>
            {v.getVirtualItems().map((vi) => {
              const e = rows[vi.index];
              return (
                <div key={e.id} role="row" aria-rowindex={vi.index + 1} data-index={vi.index} ref={v.measureElement} className="absolute inset-x-0 grid gap-x-3 gap-y-0.5 border-b border-line/[0.06] px-4 py-3 text-sm md:grid-cols-[150px_1fr_1fr_1.2fr]" style={{ transform: `translateY(${vi.start - v.options.scrollMargin}px)` }}>
                  <span role="cell" className="num text-xs text-muted md:text-sm">{formatDate(e.at, lang, true)}</span>
                  <span role="cell"><span className="font-semibold text-ink">{e.actor}</span> <span className="text-xs text-muted">· {e.role}</span></span>
                  <span role="cell" className="text-ink">{t(`act.${e.action}`)}</span>
                  <span role="cell" className="num truncate text-body">{e.target}{e.detail && <span className="block truncate text-xs text-muted">{e.detail}</span>}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
