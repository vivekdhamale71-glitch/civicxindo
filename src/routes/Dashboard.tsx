import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ClipboardCheck, FileEdit, Wallet, MessageSquare } from "lucide-react";
import { m } from "motion/react";
import { listMyApplications } from "@/api/applications";
import { listSchemes } from "@/api/schemes";
import { listDrafts } from "@/api/drafts";
import { listQueued } from "@/api/queue";
import { useCitizen } from "@/features/session";
import { RequireCitizen } from "@/features/RequireCitizen";
import { useT } from "@/i18n";
import { Card, IconTint, Skeleton, Badge } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { SchemeCard } from "@/features/schemes/SchemeCard";
import { StatusBadge } from "@/components/StatusBadge";
import { NotificationList } from "@/components/NotificationList";
import { PLink } from "@/components/PLink";
import { evaluate, profileFromCitizen } from "@/lib/eligibility";
import { formatDate } from "@/lib/utils";
import { spring, fadeUp } from "@/lib/motion";
import { STAGES } from "@/lib/types";

export default function Dashboard() {
  const { t } = useT();
  return (
    <RequireCitizen title={t("dash.title")}>
      <DashboardInner />
    </RequireCitizen>
  );
}

function DashboardInner() {
  const { t, L, lang } = useT();
  const nav = useNavigate();
  const { citizen, id } = useCitizen();
  const apps = useQuery({ queryKey: ["apps", id], queryFn: () => listMyApplications(id!), enabled: !!id });
  const schemes = useQuery({ queryKey: ["schemes"], queryFn: listSchemes });
  const drafts = useQuery({ queryKey: ["drafts", id], queryFn: () => listDrafts(id!), enabled: !!id });
  const queued = useQuery({ queryKey: ["queue"], queryFn: listQueued });

  const recommended = useMemo(() => {
    if (!citizen?.name || !schemes.data) return [];
    const p = profileFromCitizen(citizen);
    const appliedIds = new Set(apps.data?.map((a) => a.schemeId));
    return schemes.data.filter((s) => s.status === "published" && !appliedIds.has(s.id) && evaluate(s, p).eligible).slice(0, 3);
  }, [citizen, schemes.data, apps.data]);

  const hour = new Date().getHours();
  const greet = hour < 12 ? t("dash.morning") : hour < 17 ? t("dash.afternoon") : t("dash.evening");
  const name = citizen ? (lang === "hi" && citizen.nameHi ? citizen.nameHi : citizen.name) : "";
  const active = apps.data?.filter((a) => a.status !== "rejected" && a.stage !== "credited") ?? [];
  const schemeName = (sid: string) => L(schemes.data?.find((s) => s.id === sid)?.name);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-medium text-muted">{formatDate(new Date(), lang)}</p>
        <h1 className="t-scale mt-1 text-[28px] font-semibold tracking-[-0.01em] md:text-[32px]">
          {greet}{name ? `, ${name.split(" ")[0]}` : ""}
        </h1>
        {!citizen?.name && <p className="mt-1 text-body">{t("dash.complete_profile")} <PLink to="/profile" className="font-semibold text-info hover:underline">{t("dash.go_profile")}</PLink></p>}
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { to: "/eligibility", icon: ClipboardCheck, label: t("nav.eligibility") },
          { to: "/track", icon: ArrowRight, label: t("nav.track") },
          { to: "/wallet", icon: Wallet, label: t("nav.wallet") },
          { to: "/grievances", icon: MessageSquare, label: t("nav.grievances") },
        ].map((x, i) => (
          <m.div key={x.to} variants={fadeUp} initial="hidden" animate="show" custom={i} whileTap={{ scale: 0.97 }}>
            <PLink to={x.to} className="card flex min-h-[88px] flex-col justify-between p-4 hover:border-line/[0.16]">
              <IconTint size={36}><x.icon className="size-4" aria-hidden /></IconTint>
              <span className="t-scale mt-2 text-sm font-semibold text-ink">{x.label}</span>
            </PLink>
          </m.div>
        ))}
      </div>

      {(queued.data?.length ?? 0) > 0 && (
        <Card className="flex items-center gap-3 border-review/30 p-4">
          <Badge tone="review" dot>{t("queue.waiting")}</Badge>
          <p className="text-sm text-ink">{t("queue.count", { n: queued.data!.length })}</p>
        </Card>
      )}

      {(drafts.data?.length ?? 0) > 0 && (
        <section aria-labelledby="drafts-title">
          <h2 id="drafts-title" className="t-scale mb-3 text-xl font-semibold">{t("dash.drafts")}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {drafts.data!.map((d) => (
              <Card key={d.id} className="flex items-center gap-4 p-4">
                <IconTint><FileEdit className="size-5" aria-hidden /></IconTint>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{schemeName(d.schemeId)}</p>
                  <p className="text-sm text-muted">{t("dash.draft_step", { n: d.step + 1 })} · {formatDate(d.updatedAt, lang, true)}</p>
                </div>
                <Button size="sm" onClick={() => nav(`/apply/${d.schemeId}`)}>{t("dash.continue")}</Button>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="active-title">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="active-title" className="t-scale text-xl font-semibold">{t("dash.active")}</h2>
          <PLink to="/track" className="text-sm font-semibold text-info hover:underline">{t("home.view_all")}</PLink>
        </div>
        {apps.isLoading ? (
          <Skeleton className="h-24" />
        ) : active.length === 0 ? (
          <Card className="p-6 text-center text-body">{t("dash.no_active")}</Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {active.slice(0, 4).map((a, i) => {
              const idx = STAGES.indexOf(a.stage);
              return (
                <m.div key={a.id} variants={fadeUp} initial="hidden" animate="show" custom={i} whileTap={{ scale: 0.97 }} transition={spring.snappy}>
                  <PLink to={`/track/${a.id}`} className="card block p-4 hover:border-line/[0.16]">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-ink">{schemeName(a.schemeId)}</p>
                      <StatusBadge app={a} />
                    </div>
                    <p className="num mt-1 text-xs text-muted">{a.ref}</p>
                    <div className="mt-4 flex gap-1" aria-label={t("track.progress", { n: idx + 1, total: 5 })}>
                      {STAGES.map((s, j) => (
                        <span key={s} className={`h-1.5 flex-1 rounded-full ${j <= idx ? (a.status === "sent_back" ? "bg-review" : "bg-approved") : "bg-ink/[0.1]"}`} />
                      ))}
                    </div>
                  </PLink>
                </m.div>
              );
            })}
          </div>
        )}
      </section>

      <section aria-labelledby="rec-title">
        <h2 id="rec-title" className="t-scale mb-1 text-xl font-semibold">{t("dash.recommended")}</h2>
        <p className="mb-3 text-sm text-body">{t("dash.recommended_sub")}</p>
        {recommended.length === 0 ? (
          <Card className="p-6 text-center text-body">{t("dash.no_rec")} <PLink to="/eligibility" className="font-semibold text-info hover:underline">{t("home.cta")}</PLink></Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{recommended.map((s, i) => <SchemeCard key={s.id} s={s} i={i} />)}</div>
        )}
      </section>

      <section aria-labelledby="notif-title">
        <h2 id="notif-title" className="t-scale mb-3 text-xl font-semibold">{t("notif.title")}</h2>
        <Card className="p-2">{id && <NotificationList userId={id} limit={5} />}</Card>
      </section>
    </div>
  );
}
