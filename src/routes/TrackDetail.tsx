import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { m } from "motion/react";
import { Download, MessageSquare, Pencil, Share2, AlertTriangle, CircleCheck } from "lucide-react";
import { toast } from "sonner";
import { getApplication } from "@/api/applications";
import { getScheme } from "@/api/schemes";
import { useSession } from "@/store/session";
import { useSettings } from "@/store/settings";
import { RequireCitizen } from "@/features/RequireCitizen";
import { useT } from "@/i18n";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Timeline } from "@/features/track/Timeline";
import { StatusBadge } from "@/components/StatusBadge";
import { Stamp } from "@/components/Stamp";
import { Button } from "@/components/ui/button";
import { Card, Skeleton } from "@/components/ui/misc";
import { Sheet } from "@/components/ui/sheet";
import { EmptyState } from "@/components/EmptyState";
import { OfficialDocument } from "@/features/documents/OfficialDocument";
import { downloadOfficialPdf } from "@/features/documents/pdf";
import { useEdgeSwipeBack } from "@/lib/useEdgeSwipeBack";
import { appUrl, formatDate, formatINR, shareOrCopy } from "@/lib/utils";
import { spring } from "@/lib/motion";
import { DOC_TYPES } from "@/lib/reference";
import { PullToRefresh } from "@/components/PullToRefresh";

export default function TrackDetail() {
  const { t } = useT();
  return (
    <RequireCitizen title={t("track.title")}>
      <Inner />
    </RequireCitizen>
  );
}

function Inner() {
  const { id = "" } = useParams();
  const { t, L, lang } = useT();
  const nav = useNavigate();
  const qc = useQueryClient();
  const citizenId = useSession((s) => s.citizenId);
  const { seenStamps, markStampSeen } = useSettings();
  const [ackOpen, setAckOpen] = useState(false);
  useEdgeSwipeBack(true, "/track");
  const { data: app, isLoading } = useQuery({ queryKey: ["app", id], queryFn: () => getApplication(id) });
  const { data: scheme } = useQuery({ queryKey: ["scheme", app?.schemeId], queryFn: () => getScheme(app!.schemeId), enabled: !!app });

  // The stamp settles only the first time an approval is seen.
  useEffect(() => {
    if (!app || app.status !== "active" || (app.stage !== "sanctioned" && app.stage !== "credited")) return;
    const key = `${app.id}:${app.stage}`;
    if (useSettings.getState().seenStamps.includes(key)) return;
    const tm = setTimeout(() => markStampSeen(key), 1500);
    return () => clearTimeout(tm);
  }, [app, markStampSeen]);

  if (isLoading) return <div><Skeleton className="mb-4 h-4 w-48" /><Skeleton className="mb-6 h-24 rounded-card" /><Skeleton className="h-80 rounded-card" /></div>;
  if (!app || app.citizenId !== citizenId) return <EmptyState title={t("track.not_found")} action={<Button onClick={() => nav("/track")}>{t("track.title")}</Button>} />;

  const approved = app.status === "active" && (app.stage === "sanctioned" || app.stage === "credited");
  const stampKey = `${app.id}:${app.stage}`;
  const playStamp = approved && !seenStamps.includes(stampKey);
  const sanctionDate = app.timeline.find((e) => e.kind === "sanctioned")?.at;
  const qrId = "track-ack-qr";
  const rows = [
    { label: "Applicant / आवेदक", value: app.applicantName },
    { label: "Scheme / योजना", value: scheme?.name.en ?? "" },
    { label: "Submitted / जमा", value: formatDate(app.submittedAt, "en", true) },
    { label: "District / ज़िला", value: `${app.district}, ${app.state}` },
  ];

  return (
    <PullToRefresh onRefresh={() => qc.invalidateQueries()}>
      <Breadcrumbs items={[{ label: t("track.title"), to: "/track" }, { label: app.ref }]} />
      <Card className="relative mb-6 overflow-hidden p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="num text-sm text-muted">{app.ref}</p>
            <h1 className="t-scale mt-1 text-2xl font-semibold">{L(scheme?.name)}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <StatusBadge app={app} />
              <span className="num text-sm text-muted">{t("detail.benefit")}: <span className="font-semibold text-ink">{formatINR(app.amount)}</span></span>
            </div>
          </div>
          {approved && (
            <div className="absolute right-4 top-4 md:right-8 md:top-6">
              <Stamp animate={playStamp} date={sanctionDate ? formatDate(sanctionDate, "en") : undefined} />
            </div>
          )}
        </div>
        {approved && (
          <m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring.smooth, delay: playStamp ? 0.7 : 0 }} className="mt-6 flex items-start gap-3 rounded-input bg-approved/10 p-4 text-ink" role="status">
            <CircleCheck className="mt-0.5 size-5 shrink-0 text-approved" aria-hidden />
            <p className="text-sm">{app.stage === "credited" ? t("track.credited_msg", { amount: formatINR(app.amount), acc: app.bankAccount.slice(-4) }) : t("track.sanctioned_msg")}</p>
          </m.div>
        )}
        {app.status === "sent_back" && (
          <div className="mt-6 rounded-input border border-review/30 bg-review/10 p-4" role="alert">
            <p className="flex items-center gap-2 font-semibold text-ink"><AlertTriangle className="size-4 text-review-ink" aria-hidden />{t("track.sent_back_title")}</p>
            <p className="mt-1 text-sm text-ink">{app.correctionNote}</p>
            <Button className="mt-3" onClick={() => nav(`/apply/${app.schemeId}?resubmit=${app.id}`)}><Pencil aria-hidden />{t("track.fix")}</Button>
          </div>
        )}
        {app.status === "rejected" && (
          <div className="mt-6 rounded-input border border-rejected/30 bg-rejected/10 p-4" role="status">
            <p className="font-semibold text-ink">{t("track.rejected_title")}</p>
            <p className="mt-1 text-sm text-ink">{app.rejectionReason}</p>
            <p className="mt-2 text-sm text-body">{t("track.rejected_help")}</p>
          </div>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="p-6">
          <h2 className="t-scale mb-6 text-xl font-semibold">{t("track.status")}</h2>
          <Timeline app={app} />
        </Card>
        <aside className="space-y-4">
          <Card className="p-4">
            <h2 className="mb-3 text-base font-semibold">{t("track.actions")}</h2>
            <div className="grid gap-2">
              <Button variant="secondary" onClick={() => setAckOpen(true)}><Download aria-hidden />{t("apply.ack")}</Button>
              <Button variant="secondary" onClick={() => nav(`/grievances?app=${app.id}`)}><MessageSquare aria-hidden />{t("track.raise")}</Button>
              <Button variant="ghost" onClick={async () => { const r = await shareOrCopy({ title: t("apply.ack"), text: app.ref, url: appUrl(`/verify?ref=${encodeURIComponent(app.ref)}`) }); if (r === "copied") toast.success(t("common.link_copied")); }}><Share2 aria-hidden />{t("common.share")}</Button>
            </div>
          </Card>
          <Card className="p-4">
            <h2 className="mb-3 text-base font-semibold">{t("detail.documents")}</h2>
            <ul className="space-y-2 text-sm">
              {app.documents.map((d) => <li key={d.type} className="flex justify-between gap-2"><span className="text-body">{L(DOC_TYPES[d.type].label)}</span><span className="truncate font-medium text-ink">{d.name}</span></li>)}
            </ul>
          </Card>
        </aside>
      </div>

      <Sheet open={ackOpen} onOpenChange={setAckOpen} title={t("apply.ack")} wide footer={
        <Button className="w-full" onClick={() => downloadOfficialPdf({ title: "Application Acknowledgement", refNo: app.ref, date: app.submittedAt, rows: rows.map((r) => ({ label: r.label.split(" / ")[0], value: r.value })), signer: "civicXindo Acknowledgement Service (demo)", qrId, filename: `${app.ref.replace(/\//g, "-")}.pdf` })}>
          <Download aria-hidden />{t("apply.download")}
        </Button>
      }>
        <OfficialDocument title="Application Acknowledgement" titleHi="आवेदन पावती" refNo={app.ref} date={app.submittedAt} rows={rows} signer="civicXindo Acknowledgement Service (demo)" qrId={qrId} />
      </Sheet>
      <span className="sr-only">{lang}</span>
    </PullToRefresh>
  );
}
