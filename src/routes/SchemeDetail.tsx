import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Scheme } from "@/lib/types";
import { useNavigate, useParams } from "react-router-dom";
import { m } from "motion/react";
import { Share2, ClipboardCheck, FileEdit } from "lucide-react";
import { toast } from "sonner";
import { getScheme, isOpen } from "@/api/schemes";
import { getDraft } from "@/api/drafts";
import { useT } from "@/i18n";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { SchemePhoto } from "@/components/brand/SchemePhoto";
import { LevelBadge, ClosingBadge } from "@/features/schemes/SchemeCard";
import { SchemeBody } from "@/features/schemes/SchemeBody";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/misc";
import { useEdgeSwipeBack } from "@/lib/useEdgeSwipeBack";
import { CATEGORIES } from "@/lib/reference";
import { spring } from "@/lib/motion";
import { appUrl, haptic, shareOrCopy } from "@/lib/utils";
import { useSession } from "@/store/session";
import { preload } from "@/app/lazy";

export default function SchemeDetail() {
  const { id = "" } = useParams();
  const { t, L } = useT();
  const nav = useNavigate();
  const citizenId = useSession((s) => s.citizenId);
  useEdgeSwipeBack(true, "/schemes");
  const qc = useQueryClient();
  // Seed from the list cache so the card→detail morph happens in the same frame (no skeleton in between).
  const { data: s, isLoading } = useQuery({
    queryKey: ["scheme", id],
    queryFn: () => getScheme(id),
    initialData: () => qc.getQueryData<Scheme[]>(["schemes"])?.find((x) => x.id === id),
    initialDataUpdatedAt: () => qc.getQueryState(["schemes"])?.dataUpdatedAt,
  });
  const { data: draft } = useQuery({ queryKey: ["draft", citizenId, id], queryFn: () => getDraft(citizenId!, id), enabled: !!citizenId });

  if (isLoading)
    return (
      <div>
        <Skeleton className="mb-4 h-4 w-48" />
        <Skeleton className="mb-6 aspect-[16/6] w-full rounded-card" />
        <Skeleton className="mb-3 h-8 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  if (!s) return <EmptyState title={t("detail.not_found")} action={<Button onClick={() => nav("/schemes")}>{t("home.browse")}</Button>} />;

  const open = isOpen(s);
  const apply = () => {
    haptic();
    nav(citizenId ? `/apply/${s.id}` : `/login?next=${encodeURIComponent(`/apply/${s.id}`)}`);
  };
  const share = async () => {
    const r = await shareOrCopy({ title: L(s.name), text: L(s.tagline), url: appUrl(`/schemes/${s.id}`) });
    if (r === "copied") toast.success(t("common.link_copied"));
  };

  return (
    <div className="pb-24 md:pb-0">
      <Breadcrumbs items={[{ label: t("nav.schemes"), to: "/schemes" }, { label: L(s.name) }]} />
      <header className="card mb-6 overflow-hidden">
        <m.div layoutId={`scheme-art-${s.id}`} transition={spring.smooth} className="relative aspect-[16/7] w-full overflow-hidden bg-ink/[0.03] md:aspect-[16/5]">
          <SchemePhoto schemeId={s.id} category={s.category} eager />
        </m.div>
        <div className="p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <m.span layoutId={`scheme-badge-${s.id}`} transition={spring.smooth}><LevelBadge s={s} /></m.span>
            <span className="text-sm font-medium text-muted">{L(CATEGORIES[s.category])}</span>
            <ClosingBadge s={s} />
          </div>
          <m.h1 layoutId={`scheme-title-${s.id}`} transition={spring.smooth} className="t-scale text-[26px] font-semibold leading-tight tracking-[-0.01em] md:text-[32px]">
            {L(s.name)}
          </m.h1>
          <m.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.3 }} className="mt-2 max-w-[65ch] text-[17px]">
            {L(s.tagline)}
          </m.p>
          <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.3 }} className="mt-6 hidden flex-wrap gap-3 md:flex">
            <Button size="lg" onClick={apply} disabled={!open} onMouseEnter={() => preload("/apply/x")}>
              {draft ? <FileEdit aria-hidden /> : null}
              {!open ? (s.status === "paused" ? t("scheme.paused") : t("scheme.closed")) : draft ? t("detail.continue_draft") : t("detail.apply")}
            </Button>
            <Button size="lg" variant="secondary" onClick={() => nav("/eligibility")}><ClipboardCheck aria-hidden />{t("detail.check")}</Button>
            <Button size="lg" variant="ghost" onClick={share}><Share2 aria-hidden />{t("common.share")}</Button>
          </m.div>
        </div>
      </header>

      <SchemeBody s={s} />

      {/* Mobile action bar, within thumb reach */}
      <div className="glass fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-30 flex gap-2 border-t border-line/[0.08] p-3 md:hidden">
        <Button variant="secondary" size="icon" onClick={share} aria-label={t("common.share")} className="rounded-input"><Share2 aria-hidden /></Button>
        <Button size="lg" className="flex-1" onClick={apply} disabled={!open}>
          {!open ? (s.status === "paused" ? t("scheme.paused") : t("scheme.closed")) : draft ? t("detail.continue_draft") : t("detail.apply")}
        </Button>
      </div>
    </div>
  );
}
