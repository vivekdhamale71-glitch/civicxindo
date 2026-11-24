import { AnimatePresence, m } from "motion/react";
import { WifiOff, CheckCircle2 } from "lucide-react";
import { useUI } from "@/store/ui";
import { useT } from "@/i18n";
import { spring } from "@/lib/motion";

/** Thin banner that slides down when offline, turns green on reconnect, then slides away. */
export function OfflineBanner() {
  const { t } = useT();
  const online = useUI((s) => s.online);
  const sent = useUI((s) => s.sentCount);
  const show = !online || sent !== null;
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-0 z-[70] flex justify-center pt-safe">
      <AnimatePresence>
        {show && (
          <m.div
            key={online ? "on" : "off"}
            initial={{ y: -48, opacity: 0 }}
            animate={{ y: 8, opacity: 1 }}
            exit={{ y: -48, opacity: 0 }}
            transition={spring.smooth}
            className={`pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-lift ${online ? "bg-approved" : "bg-navy dark:bg-[#2A3A5E]"}`}
            role="status"
          >
            {online ? <CheckCircle2 className="size-4" aria-hidden /> : <WifiOff className="size-4" aria-hidden />}
            {online ? (sent ? t("offline.back_sent", { n: sent }) : t("offline.back")) : t("offline.banner")}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
