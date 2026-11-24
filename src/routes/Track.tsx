import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { m } from "motion/react";
import { ChevronRight, Clock } from "lucide-react";
import { listMyApplications } from "@/api/applications";
import { listSchemes } from "@/api/schemes";
import { listQueued } from "@/api/queue";
import { useSession } from "@/store/session";
import { RequireCitizen } from "@/features/RequireCitizen";
import { useT } from "@/i18n";
import { PageHeader } from "@/components/Breadcrumbs";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge, Skeleton } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { PullToRefresh } from "@/components/PullToRefresh";
import { PLink } from "@/components/PLink";
import { formatDate } from "@/lib/utils";
import { fadeUp, spring } from "@/lib/motion";
import { STAGES } from "@/lib/types";

export default function Track() {
  const { t } = useT();
  return (
    <RequireCitizen title={t("track.title")}>
      <TrackInner />
    </RequireCitizen>
  );
}

function TrackInner() {
  const { t, L, lang } = useT();
  const nav = useNavigate();
  const qc = useQueryClient();
  const id = useSession((s) => s.citizenId)!;
  const apps = useQuery({ queryKey: ["apps", id], queryFn: () => listMyApplications(id) });
  const schemes = useQuery({ queryKey: ["schemes"], queryFn: listSchemes });
  const queued = useQuery({ queryKey: ["queue"], queryFn: listQueued });
  const name = (sid: string) => L(schemes.data?.find((s) => s.id === sid)?.name);

  return (
    <PullToRefresh onRefresh={() => qc.invalidateQueries()}>
      <PageHeader title={t("track.title")} subtitle={t("track.sub")} crumbs={[{ label: t("track.title") }]} actions={<Button variant="secondary" onClick={() => nav("/grievances")}>{t("nav.grievances")}</Button>} />
      {(queued.data?.length ?? 0) > 0 && (
        <section className="mb-6" aria-labelledby="queued-title">
          <h2 id="queued-title" className="mb-2 text-base font-semibold">{t("queue.title")}</h2>
          <ul className="space-y-2">
            {queued.data!.map((q) => (
              <li key={q.id} className="card flex items-center gap-3 p-4">
                <Clock className="size-5 text-review-ink" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{q.label}</p>
                  <p className="text-sm text-muted">{formatDate(q.createdAt, lang, true)}</p>
                </div>
                <Badge tone="review" dot>{t("queue.waiting")}</Badge>
              </li>
            ))}
          </ul>
        </section>
      )}
      {apps.isLoading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-card" />)}</div>
      ) : !apps.data?.length ? (
        <EmptyState title={t("track.empty")} body={t("track.empty_sub")} action={<Button onClick={() => nav("/eligibility")}>{t("home.cta")}</Button>} />
      ) : (
        <ul className="space-y-3">
          {apps.data.map((a, i) => {
            const idx = STAGES.indexOf(a.stage);
            return (
              <m.li key={a.id} variants={fadeUp} initial="hidden" animate="show" custom={i}>
                <m.div whileTap={{ scale: 0.97 }} whileHover={{ y: -1 }} transition={spring.snappy}>
                  <PLink to={`/track/${a.id}`} className="card flex items-center gap-4 p-4 hover:border-line/[0.16]">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-ink">{name(a.schemeId)}</p>
                        <StatusBadge app={a} />
                      </div>
                      <p className="num mt-0.5 text-xs text-muted">{a.ref} · {t("track.submitted_on", { d: formatDate(a.submittedAt, lang) })}</p>
                      <div className="mt-3 flex max-w-[320px] gap-1" aria-hidden>
                        {STAGES.map((s, j) => <span key={s} className={`h-1.5 flex-1 rounded-full ${j <= idx ? (a.status === "rejected" ? "bg-rejected" : a.status === "sent_back" ? "bg-review" : "bg-approved") : "bg-ink/[0.1]"}`} />)}
                      </div>
                      {a.status === "sent_back" && <p className="mt-2 text-sm font-semibold text-review-ink">{t("track.action_needed")}</p>}
                    </div>
                    <ChevronRight className="size-5 text-muted" aria-hidden />
                  </PLink>
                </m.div>
              </m.li>
            );
          })}
        </ul>
      )}
    </PullToRefresh>
  );
}
