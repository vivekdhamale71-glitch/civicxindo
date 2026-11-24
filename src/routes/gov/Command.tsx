import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as Tabs from "@radix-ui/react-tabs";
import { m } from "motion/react";
import { AlertTriangle, Pause, Play, Check, Ban, Upload, UserPlus, Building2, MessageSquare, History } from "lucide-react";
import { toast } from "sonner";
import { listAllSchemes, listByStatus, publishScheme, setPaused } from "@/api/schemes";
import { listFraud, setFlagStatus } from "@/api/applications";
import { listAllGrievances, updateGrievance } from "@/api/grievances";
import { listOfficials, listDepartments, setOfficialActive, addOfficial, addDepartment, listAudit } from "@/api/admin";
import { useOfficial } from "@/features/session";
import { useT } from "@/i18n";
import { PageHeader } from "@/components/Breadcrumbs";
import { Badge, Card, Field, Input, Select, Skeleton, Textarea } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Sheet } from "@/components/ui/sheet";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { PLink } from "@/components/PLink";
import { ROLES } from "@/lib/reference";
import { compactINR, formatDate, cn } from "@/lib/utils";
import { spring, ease, fadeUp } from "@/lib/motion";
import type { Grievance, Role } from "@/lib/types";

const CHECKLIST = ["c1", "c2", "c3", "c4"];

export default function Command() {
  const { t, L, lang } = useT();
  const { official } = useOfficial();
  const schemes = useQuery({ queryKey: ["all-schemes"], queryFn: listAllSchemes });
  const awaiting = useQuery({ queryKey: ["approved-schemes"], queryFn: () => listByStatus("approved") });
  const fraud = useQuery({ queryKey: ["fraud"], queryFn: listFraud });
  const grievances = useQuery({ queryKey: ["all-grievances"], queryFn: listAllGrievances });
  const officials = useQuery({ queryKey: ["officials-list"], queryFn: listOfficials });
  const depts = useQuery({ queryKey: ["departments"], queryFn: listDepartments });
  const audit = useQuery({ queryKey: ["audit"], queryFn: listAudit });
  const [tab, setTab] = useState("overview");
  const [checks, setChecks] = useState<Record<string, Set<string>>>({});
  const [addOff, setAddOff] = useState(false);
  const [addDep, setAddDep] = useState(false);
  const [grv, setGrv] = useState<Grievance | null>(null);

  const live = (schemes.data ?? []).filter((s) => s.status === "published" || s.status === "paused");
  const totalBudget = live.reduce((n, s) => n + s.budget.total, 0);
  const totalSpent = live.reduce((n, s) => n + s.budget.spent, 0);
  const openFlags = (fraud.data ?? []).flatMap((a) => a.flags.filter((f) => f.status === "open").map((f) => ({ a, f })));
  const openGrv = (grievances.data ?? []).filter((g) => g.status !== "resolved");

  const tabs = [
    { v: "overview", label: t("cmd.t_overview") },
    { v: "fraud", label: t("cmd.t_fraud"), n: openFlags.length },
    { v: "publish", label: t("cmd.t_publish"), n: awaiting.data?.length ?? 0 },
    { v: "grievances", label: t("cmd.t_grievances"), n: openGrv.length },
    { v: "people", label: t("cmd.t_people") },
  ];

  return (
    <div>
      <PageHeader title={t("cmd.title")} subtitle={t("cmd.sub")} crumbs={[{ label: t("gov.officials_portal") }, { label: t("gov.nav_command") }]} actions={<PLink to="/gov/audit" className="inline-flex min-h-[44px] items-center gap-2 rounded-input border border-line/[0.16] bg-card px-4 text-[15px] font-semibold text-ink hover:bg-ink/[0.04]"><History className="size-[18px]" aria-hidden />{t("gov.nav_audit")}</PLink>} />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: t("cmd.k_budget"), v: totalBudget, f: (n: number) => compactINR(n, lang) },
          { label: t("cmd.k_spent"), v: totalSpent, f: (n: number) => compactINR(n, lang) },
          { label: t("cmd.k_fraud"), v: openFlags.length, f: (n: number) => String(Math.round(n)), tone: openFlags.length ? "text-rejected-ink" : "" },
          { label: t("cmd.k_publish"), v: awaiting.data?.length ?? 0, f: (n: number) => String(Math.round(n)) },
        ].map((k, i) => (
          <m.div key={k.label} variants={fadeUp} initial="hidden" animate="show" custom={i}>
            <Card className="p-4">
              <p className="text-sm text-muted">{k.label}</p>
              <p className={cn("mt-1 text-2xl font-bold text-ink", k.tone)}><AnimatedNumber value={k.v} format={k.f} /></p>
            </Card>
          </m.div>
        ))}
      </div>

      <Tabs.Root value={tab} onValueChange={setTab}>
        <Tabs.List className="no-scrollbar mb-6 flex gap-1 overflow-x-auto rounded-full bg-ink/[0.05] p-1" aria-label={t("cmd.title")}>
          {tabs.map((x) => (
            <Tabs.Trigger key={x.v} value={x.v} className={cn("relative flex min-h-[40px] shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold", tab === x.v ? "text-ink" : "text-muted")}>
              {tab === x.v && <m.span layoutId="cmd-tab" className="absolute inset-0 rounded-full bg-card shadow-card" transition={spring.snappy} />}
              <span className="relative">{x.label}</span>
              {!!x.n && <span className="num relative rounded-full bg-rejected px-1.5 text-[11px] text-white">{x.n}</span>}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="overview" className="focus:outline-none">
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">{t("cmd.budget_use")}</h2>
            {schemes.isLoading ? <Skeleton className="h-64" /> : (
              <ul className="space-y-4">
                {live.sort((a, b) => b.budget.spent / b.budget.total - a.budget.spent / a.budget.total).map((s, i) => {
                  const p = s.budget.spent / s.budget.total;
                  return (
                    <li key={s.id} className="grid items-center gap-x-4 gap-y-1 sm:grid-cols-[1fr_auto]">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="font-medium text-ink">{L(s.name)} {s.status === "paused" && <Badge tone="neutral">{t("scheme.paused")}</Badge>}</p>
                          <p className="num text-sm text-muted">{compactINR(s.budget.spent, lang)} / {compactINR(s.budget.total, lang)} · <span className={cn("font-semibold", p > 0.85 ? "text-rejected-ink" : "text-ink")}>{Math.round(p * 100)}%</span></p>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink/[0.08]">
                          <m.div className={cn("h-full origin-left rounded-full", p > 0.85 ? "bg-rejected" : "bg-primary")} initial={{ scaleX: 0 }} whileInView={{ scaleX: p }} viewport={{ once: true }} transition={{ duration: 0.7, ease: ease.out, delay: Math.min(i, 8) * 0.05 }} />
                        </div>
                      </div>
                      <label className="flex items-center gap-2 text-sm text-muted">
                        <Switch checked={s.status === "published"} onCheckedChange={async (v) => { if (!official) return; await setPaused(s.id, !v, official); toast.success(v ? t("cmd.resumed") : t("cmd.paused")); }} label={t("cmd.live_toggle", { name: L(s.name) })} />
                        {s.status === "paused" ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
          <Card className="mt-6 p-6">
            <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold">{t("cmd.recent")}</h2><PLink to="/gov/audit" className="text-sm font-semibold text-info hover:underline">{t("home.view_all")}</PLink></div>
            <ul className="divide-y divide-line/[0.06] text-sm">
              {audit.data?.slice(0, 8).map((e) => <li key={e.id} className="flex flex-wrap gap-x-2 py-2"><span className="num text-muted">{formatDate(e.at, lang, true)}</span><span className="font-semibold text-ink">{e.actor}</span><span>{t(`act.${e.action}`)}</span><span className="num text-muted">{e.target}</span></li>)}
            </ul>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="fraud" className="focus:outline-none">
          {openFlags.length === 0 ? <Card className="p-6 text-center text-body">{t("cmd.no_fraud")}</Card> : (
            <ul className="space-y-3">
              {openFlags.map(({ a, f }, i) => (
                <m.li key={a.id + f.code} variants={fadeUp} initial="hidden" animate="show" custom={i}>
                  <Card className="border-rejected/25 p-4">
                    <div className="flex flex-wrap items-start gap-3">
                      <AlertTriangle className="mt-0.5 size-5 text-rejected" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-ink">{t(`fraud.${f.code}`)} · {a.applicantName}</p>
                        <p className="num text-xs text-muted">{a.ref} · {a.district}, {a.state}</p>
                        <p className="mt-1 text-sm">{L(f.detail)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={async () => { if (!official) return; await setFlagStatus(a.id, f.code, "held", official); toast.success(t("cmd.held")); }}><Ban aria-hidden />{t("cmd.hold")}</Button>
                        <Button size="sm" variant="ghost" onClick={async () => { if (!official) return; await setFlagStatus(a.id, f.code, "cleared", official); toast.success(t("cmd.cleared")); }}><Check aria-hidden />{t("cmd.clear")}</Button>
                      </div>
                    </div>
                  </Card>
                </m.li>
              ))}
            </ul>
          )}
        </Tabs.Content>

        <Tabs.Content value="publish" className="focus:outline-none">
          {!awaiting.data?.length ? <Card className="p-6 text-center text-body">{t("cmd.no_publish")}</Card> : (
            <div className="grid gap-4 md:grid-cols-2">
              {awaiting.data.map((s) => {
                const set = checks[s.id] ?? new Set<string>();
                const ready = CHECKLIST.every((c) => set.has(c));
                return (
                  <Card key={s.id} className="p-6">
                    <p className="font-semibold text-ink">{L(s.name)}</p>
                    <p className="text-sm text-muted">{s.previous ? t("author.revision") : t("author.new_scheme")} · {compactINR(s.budget.total, lang)}</p>
                    <fieldset className="mt-4">
                      <legend className="mb-2 text-sm font-semibold text-ink">{t("cmd.checklist")}</legend>
                      <ul className="space-y-1">
                        {CHECKLIST.map((c) => (
                          <li key={c}>
                            <label className="flex min-h-[44px] cursor-pointer items-center gap-3 text-sm">
                              <Checkbox checked={set.has(c)} onCheckedChange={(v) => setChecks((p) => { const n = new Set(p[s.id] ?? []); if (v) n.add(c); else n.delete(c); return { ...p, [s.id]: n }; })} />
                              <span className="text-ink">{t(`cmd.${c}`)}</span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    </fieldset>
                    <Button className="mt-4 w-full" disabled={!ready} onClick={async () => { if (!official) return; await publishScheme(s.id, official); toast.success(t("cmd.published", { name: L(s.name) })); }}><Upload aria-hidden />{t("cmd.publish")}</Button>
                  </Card>
                );
              })}
            </div>
          )}
        </Tabs.Content>

        <Tabs.Content value="grievances" className="focus:outline-none">
          <Card className="divide-y divide-line/[0.08]">
            {(grievances.data ?? []).map((g) => (
              <div key={g.id} className="flex flex-wrap items-center gap-3 p-4">
                <MessageSquare className="size-5 text-muted" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{g.subject}</p>
                  <p className="num text-xs text-muted">{g.ref} · {formatDate(g.createdAt, lang)}</p>
                </div>
                <Badge tone={g.status === "resolved" ? "approved" : g.status === "in_progress" ? "review" : "info"} dot>{t(`grv.status_${g.status}`)}</Badge>
                {g.status !== "resolved" && <Button size="sm" variant="secondary" onClick={() => setGrv(g)}>{t("cmd.respond")}</Button>}
              </div>
            ))}
            {!grievances.data?.length && <p className="p-6 text-center text-body">{t("grv.empty")}</p>}
          </Card>
        </Tabs.Content>

        <Tabs.Content value="people" className="focus:outline-none">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold">{t("cmd.officers")}</h2><Button size="sm" onClick={() => setAddOff(true)}><UserPlus aria-hidden />{t("cmd.add_officer")}</Button></div>
              <ul className="divide-y divide-line/[0.06]">
                {officials.data?.map((o) => (
                  <li key={o.id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink">{o.name}</p>
                      <p className="truncate text-xs text-muted">{L(ROLES[o.role].label)}{o.district ? ` · ${o.district}` : ""}</p>
                    </div>
                    <Switch checked={o.active} onCheckedChange={async (v) => { if (!official) return; if (o.id === official.id) return toast.error(t("cmd.self")); await setOfficialActive(o.id, v, official); }} label={t("cmd.active_toggle", { name: o.name })} />
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="p-6">
              <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold">{t("cmd.departments")}</h2><Button size="sm" variant="secondary" onClick={() => setAddDep(true)}><Building2 aria-hidden />{t("cmd.add_dept")}</Button></div>
              <ul className="divide-y divide-line/[0.06]">
                {depts.data?.map((d) => <li key={d.id} className="py-3"><p className="font-medium text-ink">{L(d.name)}</p><p className="text-xs text-muted">{d.head}</p></li>)}
              </ul>
            </Card>
          </div>
        </Tabs.Content>
      </Tabs.Root>

      <AddOfficerSheet open={addOff} onOpenChange={setAddOff} depts={depts.data ?? []} onAdd={async (d) => { if (!official) return; await addOfficial(d, official); toast.success(t("cmd.officer_added")); setAddOff(false); }} />
      <AddDeptSheet open={addDep} onOpenChange={setAddDep} onAdd={async (en, hi, head) => { if (!official) return; await addDepartment(en, hi, head, official); toast.success(t("cmd.dept_added")); setAddDep(false); }} />
      <GrievanceSheet g={grv} onClose={() => setGrv(null)} onSave={async (status, text) => { if (!official || !grv) return; await updateGrievance(grv.id, status, text, official); toast.success(t("cmd.grv_updated")); setGrv(null); }} />
    </div>
  );
}

function AddOfficerSheet({ open, onOpenChange, depts, onAdd }: { open: boolean; onOpenChange: (v: boolean) => void; depts: { id: string; name: { en: string; hi: string } }[]; onAdd: (d: { name: string; role: Role; department: string; district?: string; email: string }) => void }) {
  const { t, L } = useT();
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("district_officer");
  const [dep, setDep] = useState("dep-sw");
  const [district, setDistrict] = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState<Record<string, string>>({});
  const submit = () => {
    const e: Record<string, string> = {};
    if (name.trim().length < 3) e.name = t("val.name");
    if (!/^\S+@\S+\.\S+$/.test(email)) e.email = t("cmd.v_email");
    setErr(e);
    if (Object.keys(e).length) return;
    onAdd({ name: name.trim(), role, department: dep, district: district || undefined, email });
    setName(""); setEmail(""); setDistrict("");
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={t("cmd.add_officer")} footer={<Button className="w-full" onClick={submit}>{t("cmd.add")}</Button>}>
      <div className="space-y-4">
        <Field label={t("apply.name")} htmlFor="ao-name" error={err.name} required><Input id="ao-name" value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label={t("cmd.role")} htmlFor="ao-role"><Select id="ao-role" value={role} onChange={(e) => setRole(e.target.value as Role)}>{(Object.keys(ROLES) as Role[]).map((r) => <option key={r} value={r}>{L(ROLES[r].label)}</option>)}</Select></Field>
        <Field label={t("cmd.department")} htmlFor="ao-dep"><Select id="ao-dep" value={dep} onChange={(e) => setDep(e.target.value)}>{depts.map((d) => <option key={d.id} value={d.id}>{L(d.name)}</option>)}</Select></Field>
        <Field label={t("apply.district")} htmlFor="ao-district"><Input id="ao-district" value={district} onChange={(e) => setDistrict(e.target.value)} /></Field>
        <Field label={t("cmd.email")} htmlFor="ao-email" error={err.email} required><Input id="ao-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
      </div>
    </Sheet>
  );
}

function AddDeptSheet({ open, onOpenChange, onAdd }: { open: boolean; onOpenChange: (v: boolean) => void; onAdd: (en: string, hi: string, head: string) => void }) {
  const { t } = useT();
  const [en, setEn] = useState("");
  const [hi, setHi] = useState("");
  const [head, setHead] = useState("");
  const [err, setErr] = useState("");
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={t("cmd.add_dept")} footer={<Button className="w-full" onClick={() => { if (en.trim().length < 4) return setErr(t("val.name")); onAdd(en.trim(), hi.trim(), head.trim() || "—"); setEn(""); setHi(""); setHead(""); }}>{t("cmd.add")}</Button>}>
      <div className="space-y-4">
        <Field label={t("cmd.dept_en")} htmlFor="ad-en" error={err} required><Input id="ad-en" value={en} onChange={(e) => { setEn(e.target.value); setErr(""); }} /></Field>
        <Field label={t("cmd.dept_hi")} htmlFor="ad-hi"><Input id="ad-hi" lang="hi" value={hi} onChange={(e) => setHi(e.target.value)} /></Field>
        <Field label={t("cmd.head")} htmlFor="ad-head"><Input id="ad-head" value={head} onChange={(e) => setHead(e.target.value)} /></Field>
      </div>
    </Sheet>
  );
}

function GrievanceSheet({ g, onClose, onSave }: { g: Grievance | null; onClose: () => void; onSave: (s: Grievance["status"], text: string) => void }) {
  const { t } = useT();
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Grievance["status"]>("resolved");
  const [err, setErr] = useState("");
  return (
    <Sheet open={!!g} onOpenChange={(o) => !o && onClose()} title={t("cmd.respond")} description={g ? `${g.ref} · ${g.subject}` : ""}
      footer={<Button className="w-full" onClick={() => { if (text.trim().length < 10) return setErr(t("gov.comment_required")); onSave(status, text.trim()); setText(""); }}>{t("common.save")}</Button>}>
      {g && <p className="mb-4 rounded-input bg-ink/[0.04] p-3 text-sm">{g.description}</p>}
      <div className="space-y-4">
        <Field label={t("cmd.new_status")} htmlFor="gs-status"><Select id="gs-status" value={status} onChange={(e) => setStatus(e.target.value as Grievance["status"])}><option value="in_progress">{t("grv.status_in_progress")}</option><option value="resolved">{t("grv.status_resolved")}</option></Select></Field>
        <Field label={t("cmd.reply")} htmlFor="gs-text" error={err} required><Textarea id="gs-text" value={text} onChange={(e) => { setText(e.target.value); setErr(""); }} /></Field>
      </div>
    </Sheet>
  );
}
