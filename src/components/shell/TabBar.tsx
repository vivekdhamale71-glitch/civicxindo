import { useLocation } from "react-router-dom";
import { m } from "motion/react";
import { TABS } from "./nav";
import { PLink } from "../PLink";
import { useT } from "@/i18n";
import { useSession } from "@/store/session";
import { spring } from "@/lib/motion";
import { cn, haptic } from "@/lib/utils";

export function TabBar() {
  const { t } = useT();
  const { pathname } = useLocation();
  const citizenId = useSession((s) => s.citizenId);
  return (
    <nav aria-label={t("nav.primary")} className="glass fixed inset-x-0 bottom-0 z-40 border-t border-line/[0.08] pb-safe md:hidden">
      <ul className="mx-auto grid h-16 max-w-[520px] grid-cols-5 px-1">
        {TABS.map((tab) => {
          const active = tab.match.test(pathname);
          const Icon = tab.icon;
          const to = "authTo" in tab && citizenId ? tab.authTo : tab.to;
          return (
            <li key={tab.key} className="flex">
              <PLink
                to={to}
                onClick={() => haptic()}
                aria-current={active ? "page" : undefined}
                className={cn("relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold", active ? "text-ink" : "text-muted")}
              >
                <span className="relative flex h-8 w-14 items-center justify-center">
                  {active && <m.span layoutId="tab-pill" className="absolute inset-0 rounded-full bg-ink/[0.1]" transition={spring.snappy} />}
                  <m.span className="relative" animate={{ scale: active ? 1.1 : 1 }} transition={spring.snappy}>
                    <Icon className="size-[22px]" strokeWidth={active ? 2.2 : 1.8} aria-hidden />
                  </m.span>
                </span>
                <span className="relative t-scale">{t(tab.label)}</span>
              </PLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
