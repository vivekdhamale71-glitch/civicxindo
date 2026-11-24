import { create } from "zustand";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallState {
  deferred: BeforeInstallPromptEvent | null;
  installed: boolean;
}

export const useInstall = create<InstallState>()(() => ({ deferred: null, installed: false }));

// Capture as early as possible (this module is imported from main.tsx).
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    useInstall.setState({ deferred: e as BeforeInstallPromptEvent });
  });
  window.addEventListener("appinstalled", () => useInstall.setState({ deferred: null, installed: true }));
}

export async function promptInstall() {
  const ev = useInstall.getState().deferred;
  if (!ev) return "unavailable" as const;
  await ev.prompt();
  const { outcome } = await ev.userChoice;
  useInstall.setState({ deferred: null });
  return outcome;
}
