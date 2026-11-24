import { ChevronRight } from "lucide-react";
import { PLink } from "./PLink";
import { useT } from "@/i18n";

export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  const { t } = useT();
  return (
    <nav aria-label={t("common.breadcrumb")} className="mb-4">
      <ol className="no-scrollbar flex items-center gap-1 overflow-x-auto whitespace-nowrap text-sm text-muted">
        <li>
          <PLink to="/" className="rounded px-1 hover:text-ink hover:underline">{t("nav.home")}</PLink>
        </li>
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1">
            <ChevronRight className="size-3.5 opacity-60" aria-hidden />
            {it.to && i < items.length - 1 ? (
              <PLink to={it.to} className="rounded px-1 hover:text-ink hover:underline">{it.label}</PLink>
            ) : (
              <span aria-current="page" className="max-w-[60vw] truncate px-1 font-medium text-ink">{it.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageHeader({ title, subtitle, crumbs, actions }: { title: string; subtitle?: string; crumbs?: { label: string; to?: string }[]; actions?: React.ReactNode }) {
  return (
    <header className="mb-6">
      {crumbs && <Breadcrumbs items={crumbs} />}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="t-scale text-2xl font-semibold tracking-[-0.01em] md:text-[32px] md:leading-tight">{title}</h1>
          {subtitle && <p className="mt-1 max-w-[65ch] text-body">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}
