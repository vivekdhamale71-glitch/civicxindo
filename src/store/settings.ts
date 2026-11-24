import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Lang } from "@/lib/types";
import { loadLang } from "@/i18n/dicts";

export type TextSize = "sm" | "md" | "lg" | "xl";
const SIZES: TextSize[] = ["sm", "md", "lg", "xl"];
const FONT: Record<TextSize, string> = { sm: "93.75%", md: "100%", lg: "112.5%", xl: "125%" };

interface SettingsState {
  lang: Lang;
  theme: "light" | "dark";
  contrast: "normal" | "high";
  textSize: TextSize;
  notifications: boolean;
  visits: number;
  installDismissedAt: number | null;
  eligibilityDone: boolean;
  seenStamps: string[];
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  setTheme: (t: "light" | "dark") => void;
  toggleContrast: () => void;
  setContrast: (c: "normal" | "high") => void;
  setTextSize: (s: TextSize) => void;
  bumpText: (dir: -1 | 0 | 1) => void;
  setNotifications: (v: boolean) => void;
  registerVisit: () => void;
  dismissInstall: () => void;
  markEligibilityDone: () => void;
  markStampSeen: (id: string) => void;
}

export function applyAppearance(s: Pick<SettingsState, "lang" | "theme" | "contrast" | "textSize">) {
  const d = document.documentElement;
  d.classList.toggle("dark", s.theme === "dark");
  if (s.contrast === "high") d.setAttribute("data-contrast", "high");
  else d.removeAttribute("data-contrast");
  d.lang = s.lang;
  d.style.fontSize = FONT[s.textSize];
  const meta = document.querySelector('meta[name="theme-color"]');
  meta?.setAttribute("content", s.theme === "dark" ? "#0E1626" : "#1B2A4A");
}

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      lang: "en",
      theme: "light",
      contrast: "normal",
      textSize: "md",
      notifications: false,
      visits: 0,
      installDismissedAt: null,
      eligibilityDone: false,
      seenStamps: [],
      setLang: (lang) => {
        loadLang(lang).then(() => set({ lang }));
      },
      toggleLang: () => get().setLang(get().lang === "en" ? "hi" : "en"),
      setTheme: (theme) => set({ theme }),
      toggleContrast: () => set({ contrast: get().contrast === "high" ? "normal" : "high" }),
      setContrast: (contrast) => set({ contrast }),
      setTextSize: (textSize) => set({ textSize }),
      bumpText: (dir) => {
        if (dir === 0) return set({ textSize: "md" });
        const i = SIZES.indexOf(get().textSize) + dir;
        set({ textSize: SIZES[Math.max(0, Math.min(SIZES.length - 1, i))] });
      },
      setNotifications: (notifications) => set({ notifications }),
      registerVisit: () => set({ visits: get().visits + 1 }),
      dismissInstall: () => set({ installDismissedAt: Date.now() }),
      markEligibilityDone: () => set({ eligibilityDone: true }),
      markStampSeen: (id) => set({ seenStamps: [...get().seenStamps.slice(-50), id] }),
    }),
    { name: "cx-settings" },
  ),
);

useSettings.subscribe((s) => applyAppearance(s));
