import { useEffect, useRef } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { toast } from "sonner";
import { useUI } from "@/store/ui";
import { flushQueue } from "@/api/queue";
import { processPending } from "@/api/applications";
import { translate } from "@/i18n";
import { useSettings } from "@/store/settings";

/** Service worker registration, update prompt, connectivity and offline queue. */
export function PwaManager() {
  const setOnline = useUI((s) => s.setOnline);
  const setSentCount = useUI((s) => s.setSentCount);
  const timer = useRef<number>();

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      // Check for updates every 30 minutes while the app is open.
      if (reg) setInterval(() => reg.update().catch(() => undefined), 30 * 60_000);
    },
  });

  useEffect(() => {
    if (!needRefresh) return;
    const lang = useSettings.getState().lang;
    toast(translate(lang, "update.title"), {
      description: translate(lang, "update.body"),
      duration: Infinity,
      action: { label: translate(lang, "update.refresh"), onClick: () => updateServiceWorker(true) },
    });
  }, [needRefresh, updateServiceWorker]);

  useEffect(() => {
    const flush = async () => {
      const n = await flushQueue();
      setSentCount(n);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setSentCount(null), 2800);
    };
    const on = () => {
      setOnline(true);
      flush();
    };
    const off = () => {
      setOnline(false);
      setSentCount(null);
    };
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === "FLUSH_QUEUE") flushQueue();
    };
    navigator.serviceWorker?.addEventListener("message", onMsg);
    // Send anything left over from a previous session.
    if (navigator.onLine) flushQueue();
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      navigator.serviceWorker?.removeEventListener("message", onMsg);
    };
  }, [setOnline, setSentCount]);

  // Simulated back office: auto-verification runs every 10 s.
  useEffect(() => {
    const id = window.setInterval(() => processPending(), 10_000);
    processPending();
    return () => window.clearInterval(id);
  }, []);

  return null;
}
