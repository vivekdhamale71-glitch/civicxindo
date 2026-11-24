import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { m } from "motion/react";
import { FilePlus2, Pencil, Eye } from "lucide-react";
import { toast } from "sonner";
import { listAllSchemes, blankScheme, saveScheme, startRevision } from "@/api/schemes";
import { useOfficial } from "@/features/session";
import { useT } from "@/i18n";
import { PageHeader } from "@/components/Breadcrumbs";
import { Badge, Card, Skeleton } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { formatDate } from "@/lib/utils";
import { fadeUp } from "@/lib/motion";
import type { Scheme } from "@/lib/types";

export const SCHEME_TONE: Record<Scheme["status"], "neutral" | "review" | "info" | "approved" | "rejected"> = {
  draft: "neutral", pending_approval: "review", approved: "info", published: "approved", paused: "neutral", sent_back: "rejected",
};

export default function AuthorSchemes() {
  const { t, L, lang } = useT();
  const nav = useNavigate();
  const { official } = useOfficial();
  const { data, isLoading } = useQuery({ queryKey: ["all-schemes"], queryFn: listAllSchemes });
  const mine = (data ?? []).filter((s) => s.authorId === official?.id && s.status !== "published" && s.status !== "paused").sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const live = (data ?? []).filter((s) => s.status === "published" || s.status === "paused");

  const create = async () => {
    if (!official) return;
    const s = blankScheme(official.id);
    await saveScheme(s);
    nav(`/gov/schemes/${s.id}`);
  };
  const revise = async (id: string) => {
    if (!official) return;
    const rev = await startRevision(id, official);
    toast.success(t("author.revision_started"));
    nav(`/gov/schemes/${rev.id}`);
  };

  return (
    <div>
      <PageHeader title={t("author.title")} subtitle={t("author.sub")} crumbs={[{ label: t("gov.officials_portal") }, { label: t("gov.nav_schemes") }]} actions={<Button onClick={create}><FilePlus2 aria-hidden />{t("author.new")}</Button>} />
      <section className="mb-8" aria-labelledby="mine">
        <h2 id="mine" className="mb-3 text-lg font-semibold">{t("author.mine")}</h2>
        {isLoading ? <Skeleton className="h-24 rounded-card" /> : mine.length === 0 ? (
          <EmptyState title={t("author.none")} body={t("author.none_sub")} action={<Button onClick={create}>{t("author.new")}</Button>} />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {mine.map((s, i) => (
              <m.li key={s.id} variants={fadeUp} initial="hidden" animate="show" custom={i}>
                <Card className="flex h-full flex-col p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="min-w-0 font-semibold text-ink">{L(s.name) || t("author.untitled")}</p>
                    <Badge tone={SCHEME_TONE[s.status]} dot>{t(`sstatus.${s.status}`)}</Badge>
                  </div>
                  <p className="text-sm text-muted">{s.id.startsWith("rev-") ? t("author.revision") : t("author.new_scheme")} · {formatDate(s.updatedAt, lang, true)}</p>
                  {s.reviewComment && <p className="mt-2 rounded-input bg-rejected/[0.06] p-2 text-sm text-ink"><span className="font-semibold">{t("author.comment")}:</span> {s.reviewComment}</p>}
                  <div className="mt-auto pt-3">
                    <Button size="sm" variant={s.status === "draft" || s.status === "sent_back" ? "primary" : "secondary"} onClick={() => nav(`/gov/schemes/${s.id}`)}>
                      {s.status === "draft" || s.status === "sent_back" ? <><Pencil aria-hidden />{t("common.edit")}</> : <><Eye aria-hidden />{t("common.view")}</>}
                    </Button>
                  </div>
                </Card>
              </m.li>
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="live">
        <h2 id="live" className="mb-3 text-lg font-semibold">{t("author.live")}</h2>
        <Card className="divide-y divide-line/[0.08]">
          {live.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{L(s.name)}</p>
                <p className="text-sm text-muted">{L(s.department)}</p>
              </div>
              <Badge tone={SCHEME_TONE[s.status]} dot>{t(`sstatus.${s.status}`)}</Badge>
              <Button size="sm" variant="secondary" onClick={() => revise(s.id)}><Pencil aria-hidden />{t("author.edit_live")}</Button>
            </div>
          ))}
        </Card>
      </section>
    </div>
  );
}
