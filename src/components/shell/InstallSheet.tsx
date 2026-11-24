import { useEffect } from "react";
import { Share, PlusSquare, Smartphone, WifiOff, Zap } from "lucide-react";
import { Sheet } from "../ui/sheet";
import { Button } from "../ui/button";
import { useUI } from "@/store/ui";
import { useSettings } from "@/store/settings";
import { useInstall, promptInstall } from "@/pwa/install";
import { useT } from "@/i18n";
import { isIOS, isStandalone, DAY } from "@/lib/utils";
import { Wheel } from "../brand/Wheel";

/** "Add civicXindo to your home screen": after the 2nd visit or finishing the eligibility check. */
export function InstallSheet() {
  const { t } = useT();
  const open = useUI((s) => s.installSheet);
  const setOpen = useUI((s) => s.setInstallSheet);
  const deferred = useInstall((s) => s.deferred);
  const { visits, eligibilityDone, installDismissedAt, dismissInstall } = useSettings();
  const ios = isIOS();

  useEffect(() => {
    if (isStandalone()) return;
    if (installDismissedAt && Date.now() - installDismissedAt < 7 * DAY) return;
    if (!(visits >= 2 || eligibilityDone)) return;
    if (!deferred && !ios) return;
    const timer = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(timer);
  }, [visits, eligibilityDone, deferred, ios, installDismissedAt, setOpen]);

  const close = () => {
    dismissInstall();
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => (v ? setOpen(true) : close())} title={t("install.title")} description={t("install.body")}>
      <div className="flex items-center gap-4 rounded-card bg-ink/[0.04] p-4">
        <span className="flex size-14 items-center justify-center rounded-[16px] bg-navy text-white"><Wheel size={40} /></span>
        <div>
          <p className="font-semibold text-ink">civicXindo</p>
          <p className="text-sm text-muted">National Welfare Schemes Portal</p>
        </div>
      </div>
      <ul className="my-6 space-y-3 text-sm">
        <li className="flex items-center gap-3"><Zap className="size-5 text-ink" aria-hidden />{t("install.fast")}</li>
        <li className="flex items-center gap-3"><WifiOff className="size-5 text-ink" aria-hidden />{t("install.offline")}</li>
        <li className="flex items-center gap-3"><Smartphone className="size-5 text-ink" aria-hidden />{t("install.native")}</li>
      </ul>
      {ios && !deferred ? (
        <ol className="space-y-3 rounded-card border border-line/[0.08] p-4 text-sm">
          <li className="flex items-center gap-3"><span className="num flex size-7 items-center justify-center rounded-full bg-ink/[0.08] font-semibold text-ink">1</span>{t("install.ios1")} <Share className="size-4 text-info" aria-label="Share" /></li>
          <li className="flex items-center gap-3"><span className="num flex size-7 items-center justify-center rounded-full bg-ink/[0.08] font-semibold text-ink">2</span>{t("install.ios2")} <PlusSquare className="size-4 text-ink" aria-hidden /></li>
          <li className="flex items-center gap-3"><span className="num flex size-7 items-center justify-center rounded-full bg-ink/[0.08] font-semibold text-ink">3</span>{t("install.ios3")}</li>
        </ol>
      ) : !deferred ? (
        <p className="rounded-card border border-line/[0.08] p-4 text-sm">{t("install.manual")}</p>
      ) : null}
      <div className="mt-6 flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={close}>{t("install.later")}</Button>
        {deferred && (
          <Button
            className="flex-1"
            hapticTick
            onClick={async () => {
              await promptInstall();
              setOpen(false);
            }}
          >
            {t("install.cta")}
          </Button>
        )}
      </div>
    </Sheet>
  );
}
