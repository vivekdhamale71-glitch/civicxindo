import { useEffect, useState } from "react";
import { Download, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";
import { useInstall, promptInstall } from "@/pwa/install";
import { useUI } from "@/store/ui";
import { useT } from "@/i18n";
import { isStandalone, haptic, cn } from "@/lib/utils";

/**
 * "Download app": uses the browser's native install prompt when available (Chrome, Edge, Android),
 * otherwise opens the install sheet with the iOS "Add to Home Screen" guide or manual steps.
 * Hidden when already running as an installed app.
 */
export function InstallButton({ variant = "full", className }: { variant?: "full" | "icon" | "header"; className?: string }) {
  const { t } = useT();
  const deferred = useInstall((s) => s.deferred);
  const installed = useInstall((s) => s.installed);
  const setInstallSheet = useUI((s) => s.setInstallSheet);
  // Decide after mount so the prerendered HTML and first client render match.
  const [standalone, setStandalone] = useState<boolean | null>(null);
  useEffect(() => setStandalone(isStandalone()), []);

  if (standalone) return null;

  const onClick = async () => {
    haptic();
    if (deferred) await promptInstall();
    else setInstallSheet(true);
  };

  if (installed)
    return variant === "full" ? (
      <p className={cn("flex items-center gap-2 font-semibold text-approved", className)} role="status">
        <CheckCircle2 className="size-5" aria-hidden /> {t("install.installed")}
      </p>
    ) : null;

  if (variant === "icon")
    return (
      <button onClick={onClick} className={cn("flex size-11 items-center justify-center rounded-full text-ink hover:bg-ink/[0.06]", className)} aria-label={t("install.download")}>
        <Download className="size-5" aria-hidden />
      </button>
    );

  if (variant === "header")
    return (
      <Button variant="secondary" size="sm" onClick={onClick} className={cn("rounded-full", className)}>
        <Download aria-hidden /> {t("install.download")}
      </Button>
    );

  return (
    <Button size="lg" onClick={onClick} className={className} hapticTick>
      <Download aria-hidden /> {t("install.download")}
    </Button>
  );
}
