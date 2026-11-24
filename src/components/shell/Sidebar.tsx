import { useLocation } from "react-router-dom";
import { m } from "motion/react";
import { Building2 } from "lucide-react";
import { TABS, SIDEBAR_EXTRA } from "./nav";
import { PLink } from "../PLink";
import { useT } from "@/i18n";
import { useSession } from "@/store/session";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { t } = useT();
  const { pathname } = useLocation();
  const citizenId = useSession((s) => s.citizenId);
  const items = [
    ...TABS.map((x) => ({ to: "authTo" in x && citizenId ? x.authTo : x.to, icon: x.icon, label: x.label, active: x.match.test(pathname) })),
    ...SIDEBAR_EXTRA.map((x) => ({ ...x, active: pathname.startsWith(x.to) })),
  ];
  // Grievances also matches the Track tab regex; prefer the more specific entry.
  const specific = items.find((i) => i.to !== "/track" && i.active && i.to.length > 1 && pathname.startsWith(i.to));
  return (
    <nav aria-label={t("nav.primary")} className="sticky top-[96px] hidden w-56 shrink-0 self-start py-8 md:block lg:w-60">
      <ul className="space-y-1">
        {items.map((it, idx) => {
          const active = specific ? it === specific : it.active;
          const Icon = it.icon;
          return (
            <li key={it.to + idx}>
              {idx === TABS.length && <div className="mx-3 my-3 h-px bg-line/[0.08]" aria-hidden />}
              <PLink
                to={it.to}
                aria-current={active ? "page" : undefined}
                className={cn("relative flex min-h-[44px] items-center gap-3 rounded-input px-3 text-[15px] font-medium transition-colors", active ? "text-ink" : "text-body hover:bg-ink/[0.04] hover:text-ink")}
              >
                {active && <m.span layoutId="side-pill" className="absolute inset-0 rounded-input bg-ink/[0.07]" transition={spring.snappy} />}
                {active && <m.span layoutId="side-bar" className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-saffron" transition={spring.snappy} />}
                <Icon className="relative size-5" strokeWidth={active ? 2.2 : 1.8} aria-hidden />
                <span className="t-scale relative">{t(it.label)}</span>
              </PLink>
            </li>
          );
        })}
      </ul>
      <div className="mt-6 border-t border-line/[0.08] pt-4">
        <PLink to="/gov/login" className="flex min-h-[44px] items-center gap-3 rounded-input px-3 text-sm font-medium text-muted hover:bg-ink/[0.04] hover:text-ink">
          <Building2 className="size-5" aria-hidden />
          {t("nav.officials")}
        </PLink>
      </div>
    </nav>
  );
}
