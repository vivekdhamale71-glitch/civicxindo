import { Suspense } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { m } from "motion/react";
import { Inbox, FilePlus2, GitCompare, HandCoins, LayoutDashboard, History, LogOut, ExternalLink } from "lucide-react";
import { useSession } from "@/store/session";
import { useOfficial } from "@/features/session";
import { useT } from "@/i18n";
import { TopStrip } from "@/components/shell/TopStrip";
import { Logo } from "@/components/brand/Logo";
import { PNavLink, PLink } from "@/components/PLink";
import { Footer } from "@/components/shell/Footer";
import { PageSkeleton } from "@/components/PageSkeleton";
import { ROLES } from "@/lib/reference";
import { spring, ease } from "@/lib/motion";
import { cn, initials } from "@/lib/utils";
import type { Role } from "@/lib/types";

const NAV: Record<Role, { to: string; icon: typeof Inbox; label: string }[]> = {
  district_officer: [{ to: "/gov/queue", icon: Inbox, label: "gov.nav_queue" }],
  scheme_author: [{ to: "/gov/schemes", icon: FilePlus2, label: "gov.nav_schemes" }],
  scheme_approver: [{ to: "/gov/approvals", icon: GitCompare, label: "gov.nav_approvals" }],
  sanctioning_authority: [{ to: "/gov/sanction", icon: HandCoins, label: "gov.nav_sanction" }],
  portal_manager: [{ to: "/gov/command", icon: LayoutDashboard, label: "gov.nav_command" }],
};

export default function GovLayout() {
  const { t, L } = useT();
  const { pathname } = useLocation();
  const nav = useNavigate();
  const role = useSession((s) => s.role);
  const logout = useSession((s) => s.logoutOfficial);
  const { official } = useOfficial();
  if (!role) return <Navigate to="/gov/login" replace />;
  const items = [...NAV[role], { to: "/gov/audit", icon: History, label: "gov.nav_audit" }];

  return (
    <div className="min-h-screen bg-page">
      <a href="#main" className="sr-only-focusable fixed left-4 top-2 z-[80] rounded-input bg-card px-4 py-2 font-semibold text-ink shadow-lift">Skip to main content</a>
      <TopStrip />
      <header className="glass sticky top-0 z-40 border-b border-line/[0.06]">
        <div className="container-x flex h-16 items-center gap-4">
          <Logo compact />
          <span className="hidden rounded-full bg-navy px-3 py-1 text-xs font-semibold text-white sm:inline">{t("gov.officials_portal")}</span>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden text-right md:block">
              <p className="text-sm font-semibold text-ink">{official?.name}</p>
              <p className="text-xs text-muted">{L(ROLES[role].label)}</p>
            </div>
            <span className="flex size-10 items-center justify-center rounded-full bg-ink/[0.08] text-sm font-bold text-ink" aria-hidden>{official ? initials(official.name) : ""}</span>
            <button onClick={() => { logout(); nav("/gov/login"); }} className="flex size-11 items-center justify-center rounded-full text-ink hover:bg-ink/[0.06]" aria-label={t("gov.switch")}>
              <LogOut className="size-5" />
            </button>
          </div>
        </div>
        <div className="tricolour" aria-hidden />
        <nav aria-label={t("gov.nav")} className="container-x no-scrollbar flex gap-1 overflow-x-auto md:hidden">
          {items.map((it) => (
            <PNavLink key={it.to} to={it.to} className={({ isActive }) => cn("relative flex min-h-[44px] shrink-0 items-center gap-2 px-3 text-sm font-semibold", isActive ? "text-ink" : "text-muted")}>
              {({ isActive }) => (<>{isActive && <m.span layoutId="gov-tab" className="absolute inset-x-2 bottom-0 h-[3px] rounded-full bg-saffron" transition={spring.snappy} />}<it.icon className="size-4" aria-hidden />{t(it.label)}</>)}
            </PNavLink>
          ))}
        </nav>
      </header>
      <div className="container-x flex gap-8">
        <nav aria-label={t("gov.nav")} className="sticky top-[88px] hidden w-56 shrink-0 self-start py-8 md:block">
          <ul className="space-y-1">
            {items.map((it) => (
              <li key={it.to}>
                <PNavLink to={it.to} className={({ isActive }) => cn("relative flex min-h-[44px] items-center gap-3 rounded-input px-3 text-[15px] font-medium", isActive ? "text-ink" : "text-body hover:bg-ink/[0.04]")}>
                  {({ isActive }) => (<>{isActive && <m.span layoutId="gov-side" className="absolute inset-0 rounded-input bg-ink/[0.07]" transition={spring.snappy} />}{isActive && <m.span layoutId="gov-bar" className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-saffron" transition={spring.snappy} />}<it.icon className="relative size-5" aria-hidden /><span className="relative">{t(it.label)}</span></>)}
                </PNavLink>
              </li>
            ))}
          </ul>
          <div className="mt-6 border-t border-line/[0.08] pt-4">
            <PLink to="/" className="flex min-h-[44px] items-center gap-3 rounded-input px-3 text-sm text-muted hover:bg-ink/[0.04] hover:text-ink"><ExternalLink className="size-4" aria-hidden />{t("gov.citizen_portal")}</PLink>
          </div>
        </nav>
        <main id="main" tabIndex={-1} className="min-w-0 flex-1 pb-12 pt-6 focus:outline-none md:pt-8">
          <Suspense fallback={<PageSkeleton />}>
            <m.div key={pathname} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ ...spring.smooth, opacity: { duration: 0.2, ease: ease.out } }}>
              <Outlet />
            </m.div>
          </Suspense>
        </main>
      </div>
      <Footer />
    </div>
  );
}
