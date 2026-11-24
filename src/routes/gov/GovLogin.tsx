import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { m } from "motion/react";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { listOfficialsLocal } from "@/api/admin";
import { useSession } from "@/store/session";
import { useT } from "@/i18n";
import { TopStrip } from "@/components/shell/TopStrip";
import { Logo } from "@/components/brand/Logo";
import { Skeleton } from "@/components/ui/misc";
import { ROLES } from "@/lib/reference";
import { fadeUp, spring } from "@/lib/motion";
import { haptic, initials } from "@/lib/utils";
import { PLink } from "@/components/PLink";
import type { Role } from "@/lib/types";

const ORDER: Role[] = ["district_officer", "scheme_author", "scheme_approver", "sanctioning_authority", "portal_manager"];

export default function GovLogin() {
  const { t, L } = useT();
  const nav = useNavigate();
  const login = useSession((s) => s.loginOfficial);
  const { data } = useQuery({ queryKey: ["officials"], queryFn: listOfficialsLocal });
  const accounts = ORDER.map((r) => data?.find((o) => o.role === r && o.active));

  return (
    <div className="min-h-screen bg-page">
      <TopStrip />
      <header className="border-b border-line/[0.06] bg-card">
        <div className="container-x flex h-16 items-center justify-between">
          <Logo />
          <PLink to="/" className="text-sm font-semibold text-info hover:underline">{t("gov.citizen_portal")}</PLink>
        </div>
        <div className="tricolour" aria-hidden />
      </header>
      <main id="main" className="container-x max-w-[720px] py-10">
        <h1 className="t-scale text-[28px] font-semibold">{t("gov.login_title")}</h1>
        <p className="mt-1 text-body">{t("gov.login_sub")}</p>
        <div className="mt-4 flex items-start gap-3 rounded-card border border-review/30 bg-review/10 p-4 text-sm text-ink">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-review-ink" aria-hidden />
          {t("gov.demo_note")}
        </div>
        <ul className="mt-6 grid gap-3">
          {accounts.map((o, i) =>
            o ? (
              <m.li key={o.id} variants={fadeUp} initial="hidden" animate="show" custom={i}>
                <m.button
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ y: -1 }}
                  transition={spring.snappy}
                  onClick={() => { haptic(); login(o.id, o.role); nav(ROLES[o.role].home); }}
                  className="card flex w-full items-center gap-4 p-4 text-left hover:border-line/[0.16]"
                >
                  <span className="flex size-12 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">{initials(o.name)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-muted">{L(ROLES[o.role].label)}</span>
                    <span className="block font-semibold text-ink">{o.name}</span>
                    <span className="block truncate text-sm text-muted">{L(o.designation)}{o.district ? ` · ${o.district}` : ""}</span>
                  </span>
                  <ArrowRight className="size-5 text-muted" aria-hidden />
                </m.button>
              </m.li>
            ) : (
              <Skeleton key={i} className="h-20 rounded-card" />
            ),
          )}
        </ul>
      </main>
    </div>
  );
}
