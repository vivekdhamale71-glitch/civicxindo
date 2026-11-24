import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { m } from "motion/react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { listMyGrievances, submitGrievance, type GrievancePayload } from "@/api/grievances";
import { listMyApplications } from "@/api/applications";
import { listSchemes } from "@/api/schemes";
import { enqueue } from "@/api/queue";
import { useCitizen } from "@/features/session";
import { RequireCitizen } from "@/features/RequireCitizen";
import { useT } from "@/i18n";
import { PageHeader } from "@/components/Breadcrumbs";
import { Badge, Card, Field, Input, Select, Textarea, Skeleton } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { formatDate } from "@/lib/utils";
import { fadeUp } from "@/lib/motion";

export default function Grievances() {
  const { t } = useT();
  return (
    <RequireCitizen title={t("grv.title")}>
      <Inner />
    </RequireCitizen>
  );
}

function Inner() {
  const { t, L, lang } = useT();
  const [params] = useSearchParams();
  const { citizen, id } = useCitizen();
  const apps = useQuery({ queryKey: ["apps", id], queryFn: () => listMyApplications(id!), enabled: !!id });
  const schemes = useQuery({ queryKey: ["schemes"], queryFn: listSchemes });
  const list = useQuery({ queryKey: ["grievances", id], queryFn: () => listMyGrievances(id!), enabled: !!id });
  const [appId, setAppId] = useState(params.get("app") ?? "");
  const [subject, setSubject] = useState("");
  const [desc, setDesc] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const name = (sid?: string) => L(schemes.data?.find((s) => s.id === sid)?.name);

  const submit = useMutation({
    mutationFn: async (p: GrievancePayload) => {
      if (!navigator.onLine) {
        await enqueue("grievance", p, `${t("grv.title")}: ${p.subject}`);
        return "queued" as const;
      }
      await submitGrievance(p);
      return "sent" as const;
    },
    onSuccess: (r) => {
      toast.success(r === "queued" ? t("grv.queued") : t("grv.sent"));
      setSubject("");
      setDesc("");
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!appId) er.app = t("grv.err_app");
    if (subject.trim().length < 5) er.subject = t("grv.err_subject");
    if (desc.trim().length < 15) er.desc = t("grv.err_desc");
    setErrors(er);
    if (Object.keys(er).length) return;
    submit.mutate({ appId, citizenId: id!, citizenName: citizen?.name ?? "", subject: subject.trim(), description: desc.trim() });
  };

  return (
    <div>
      <PageHeader title={t("grv.title")} subtitle={t("grv.sub")} crumbs={[{ label: t("track.title"), to: "/track" }, { label: t("grv.title") }]} />
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card as="section" className="p-6" aria-labelledby="grv-new">
          <h2 id="grv-new" className="mb-4 text-lg font-semibold">{t("grv.new")}</h2>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <Field label={t("grv.app")} htmlFor="g-app" error={errors.app} required>
              <Select id="g-app" value={appId} onChange={(e) => setAppId(e.target.value)} aria-invalid={!!errors.app}>
                <option value="">{t("common.select")}</option>
                {apps.data?.map((a) => <option key={a.id} value={a.id}>{name(a.schemeId)} – {a.ref}</option>)}
              </Select>
            </Field>
            <Field label={t("grv.subject")} htmlFor="g-subject" error={errors.subject} required>
              <Input id="g-subject" value={subject} onChange={(e) => setSubject(e.target.value)} aria-invalid={!!errors.subject} maxLength={100} />
            </Field>
            <Field label={t("grv.desc")} htmlFor="g-desc" error={errors.desc} hint={t("grv.desc_hint")} required>
              <Textarea id="g-desc" value={desc} onChange={(e) => setDesc(e.target.value)} aria-invalid={!!errors.desc} maxLength={1000} />
            </Field>
            <Button type="submit" size="lg" disabled={submit.isPending}><Send aria-hidden />{t("grv.submit")}</Button>
          </form>
        </Card>
        <section aria-labelledby="grv-list">
          <h2 id="grv-list" className="mb-3 text-lg font-semibold">{t("grv.mine")}</h2>
          {list.isLoading ? <Skeleton className="h-32 rounded-card" /> : !list.data?.length ? (
            <EmptyState title={t("grv.empty")} body={t("grv.empty_sub")} />
          ) : (
            <ul className="space-y-3">
              {list.data.map((g, i) => (
                <m.li key={g.id} variants={fadeUp} initial="hidden" animate="show" custom={i} className="card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{g.subject}</p>
                      <p className="num text-xs text-muted">{g.ref} · {formatDate(g.createdAt, lang)}</p>
                    </div>
                    <Badge tone={g.status === "resolved" ? "approved" : g.status === "in_progress" ? "review" : "info"} dot>{t(`grv.status_${g.status}`)}</Badge>
                  </div>
                  <p className="mt-2 text-sm">{g.description}</p>
                  {g.updates.length > 0 && (
                    <ul className="mt-3 space-y-2 border-l-2 border-line/[0.12] pl-3 text-sm">
                      {g.updates.map((u, j) => <li key={j}><span className="font-semibold text-ink">{u.by}</span> · <span className="num text-muted">{formatDate(u.at, lang, true)}</span><br />{u.text}</li>)}
                    </ul>
                  )}
                </m.li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
