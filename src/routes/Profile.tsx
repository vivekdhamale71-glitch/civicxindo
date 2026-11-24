import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { LogIn, LogOut, Download, Trash2, RotateCcw, Bell, Languages, UserRound, Smartphone, Building2, ArrowRight } from "lucide-react";
import { Wheel } from "@/components/brand/Wheel";
import { toast } from "sonner";
import { useSession } from "@/store/session";
import { useSettings } from "@/store/settings";
import { useUI } from "@/store/ui";
import { useCitizen } from "@/features/session";
import { useT } from "@/i18n";
import { PageHeader } from "@/components/Breadcrumbs";
import { Card, IconTint } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Sheet } from "@/components/ui/sheet";
import { A11yControls } from "@/components/shell/A11yControls";
import { db } from "@/db";
import { resetDatabase } from "@/db/seed";
import { changed } from "@/api/client";
import { promptInstall, useInstall } from "@/pwa/install";
import { asset, isStandalone, initials, formatDate } from "@/lib/utils";
import { stateLabel, OCCUPATIONS } from "@/lib/reference";
import { ageFromDob } from "@/lib/eligibility";

export default function Profile() {
  const { t, L, lang } = useT();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { citizen, id } = useCitizen();
  const logout = useSession((s) => s.logoutCitizen);
  const s = useSettings();
  const setInstallSheet = useUI((x) => x.setInstallSheet);
  const deferred = useInstall((x) => x.deferred);
  const [confirm, setConfirm] = useState<null | "clear" | "reset">(null);
  const [busy, setBusy] = useState(false);

  const toggleNotifications = async (v: boolean) => {
    if (!v) return s.setNotifications(false);
    if (!("Notification" in window)) return toast.error(t("settings.notif_unsupported"));
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      s.setNotifications(true);
      const reg = await navigator.serviceWorker?.getRegistration();
      const opts = { body: t("settings.notif_test_body"), icon: asset("icons/icon-192.png") };
      if (reg) reg.showNotification("civicXindo", opts);
      else new Notification("civicXindo", opts);
    } else toast.error(t("settings.notif_denied"));
  };

  const doConfirm = async () => {
    setBusy(true);
    try {
      if (confirm === "clear") {
        await Promise.all([db.drafts.clear(), db.queue.clear()]);
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.filter((k) => k.startsWith("cx-")).map((k) => caches.delete(k)));
        }
        changed();
        toast.success(t("settings.cleared"));
      } else if (confirm === "reset") {
        await resetDatabase();
        logout();
        useSession.getState().logoutOfficial();
        qc.clear();
        changed();
        toast.success(t("settings.reset_done"));
        nav("/");
      }
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t("profile.title")} crumbs={[{ label: t("profile.title") }]} />

      {id && citizen ? (
        <Card className="overflow-hidden">
          <div aria-hidden className="relative h-20 bg-navy dark:bg-[#1E2C4D]">
            <div className="absolute -right-6 -top-10 text-white/10"><Wheel size={150} strokeWidth={1} /></div>
            <div className="tricolour absolute inset-x-0 bottom-0" />
          </div>
          <div className="px-6 pb-6">
            <span className="relative z-10 -mt-9 flex size-[72px] items-center justify-center rounded-full border-4 border-card bg-raised text-2xl font-bold text-ink shadow-card">
              {citizen.name ? initials(citizen.name) : <UserRound className="size-7" aria-hidden />}
            </span>
            <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="t-scale text-xl font-semibold text-ink">{(lang === "hi" && citizen.nameHi) || citizen.name || t("profile.unnamed")}</p>
                <p className="num text-sm text-muted">+91 {citizen.mobile}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => { logout(); toast.success(t("profile.signed_out")); nav("/"); }}><LogOut aria-hidden />{t("profile.sign_out")}</Button>
            </div>
            {citizen.name && (
              <ul className="mt-4 flex flex-wrap gap-2 text-sm">
                <li className="rounded-full bg-ink/[0.06] px-3 py-1 text-ink">{t("profile.age", { n: ageFromDob(citizen.dob) })}</li>
                <li className="rounded-full bg-ink/[0.06] px-3 py-1 text-ink">{L(OCCUPATIONS[citizen.occupation])}</li>
                <li className="rounded-full bg-ink/[0.06] px-3 py-1 text-ink">{citizen.district}, {stateLabel(citizen.state, lang)}</li>
              </ul>
            )}
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div aria-hidden className="relative h-20 bg-navy dark:bg-[#1E2C4D]">
            <div className="absolute -right-6 -top-10 text-white/10"><Wheel size={150} strokeWidth={1} /></div>
            <div className="tricolour absolute inset-x-0 bottom-0" />
          </div>
          <div className="px-6 pb-6">
            <span className="relative z-10 -mt-9 flex size-[72px] items-center justify-center rounded-full border-4 border-card bg-raised text-ink shadow-card">
              <UserRound className="size-8" aria-hidden />
            </span>
            <p className="t-scale mt-3 text-xl font-semibold text-ink">{t("profile.guest")}</p>
            <p className="mt-1 max-w-[48ch] text-body">{t("profile.guest_sub")}</p>
            <Button size="lg" className="mt-5 w-full sm:w-auto" onClick={() => nav("/login?next=/me")}><LogIn aria-hidden />{t("header.sign_in")}</Button>
          </div>
        </Card>
      )}

      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <IconTint size={48}><Building2 className="size-5" aria-hidden /></IconTint>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink">{t("profile.officials_title")}</p>
          <p className="text-sm text-body">{t("profile.officials_sub")}</p>
        </div>
        <Button variant="secondary" className="w-full sm:w-auto" onClick={() => nav("/gov/login")}>{t("nav.officials")} <ArrowRight aria-hidden /></Button>
      </Card>

      <Card as="section" className="p-6" aria-labelledby="set-lang">
        <h2 id="set-lang" className="mb-4 flex items-center gap-2 text-lg font-semibold"><Languages className="size-5" aria-hidden />{t("settings.language")}</h2>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-labelledby="set-lang">
          {(["en", "hi"] as const).map((l) => (
            <button key={l} role="radio" aria-checked={s.lang === l} onClick={() => s.setLang(l)} lang={l} className={`min-h-[52px] rounded-input border text-base font-semibold transition-colors ${s.lang === l ? "border-primary bg-primary text-primary-fg" : "border-line/[0.14] text-ink hover:border-line/[0.3]"}`}>
              {l === "en" ? "English" : "हिन्दी"}
            </button>
          ))}
        </div>
      </Card>

      <Card as="section" className="p-6" aria-labelledby="set-display">
        <h2 id="set-display" className="mb-4 text-lg font-semibold">{t("settings.display")}</h2>
        <A11yControls />
      </Card>

      <Card as="section" className="p-6" aria-labelledby="set-app">
        <h2 id="set-app" className="mb-4 text-lg font-semibold">{t("settings.app")}</h2>
        <div className="divide-y divide-line/[0.08]">
          <Row icon={<Bell className="size-5" aria-hidden />} title={t("settings.notifications")} body={t("settings.notifications_sub")}>
            <Switch checked={s.notifications} onCheckedChange={toggleNotifications} label={t("settings.notifications")} />
          </Row>
          <Row icon={<Smartphone className="size-5" aria-hidden />} title={t("settings.install")} body={isStandalone() ? t("settings.installed") : t("settings.install_sub")}>
            <Button size="sm" variant="secondary" disabled={isStandalone()} onClick={async () => { if (deferred) await promptInstall(); else setInstallSheet(true); }}>
              <Download aria-hidden />{t("settings.install_btn")}
            </Button>
          </Row>
          <Row icon={<Trash2 className="size-5" aria-hidden />} title={t("settings.clear")} body={t("settings.clear_sub")}>
            <Button size="sm" variant="secondary" onClick={() => setConfirm("clear")}>{t("settings.clear_btn")}</Button>
          </Row>
          <Row icon={<RotateCcw className="size-5" aria-hidden />} title={t("settings.reset")} body={t("settings.reset_sub")}>
            <Button size="sm" variant="secondary" onClick={() => setConfirm("reset")}>{t("settings.reset_btn")}</Button>
          </Row>
        </div>
      </Card>
      <p className="text-center text-xs text-muted">civicXindo · {t("footer.demo")} · {formatDate(__BUILD_DATE__, lang)}</p>

      <Sheet
        open={!!confirm}
        onOpenChange={(v) => !v && setConfirm(null)}
        title={confirm === "reset" ? t("settings.reset_confirm") : t("settings.clear_confirm")}
        description={confirm === "reset" ? t("settings.reset_confirm_sub") : t("settings.clear_confirm_sub")}
        footer={<div className="flex gap-2"><Button variant="secondary" className="flex-1" onClick={() => setConfirm(null)}>{t("common.cancel")}</Button><Button variant="danger" className="flex-1" disabled={busy} onClick={doConfirm}>{t("common.confirm")}</Button></div>}
      />
    </div>
  );
}

function Row({ icon, title, body, children }: { icon: React.ReactNode; title: string; body: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-4 first:pt-0 last:pb-0 sm:gap-4">
      <span className="icon-tint size-10 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold leading-snug text-ink">{title}</p>
        <p className="mt-0.5 text-[13px] leading-snug text-muted">{body}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
