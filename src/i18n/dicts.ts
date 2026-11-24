import en from "./en.json";
import type { Lang } from "@/lib/types";

type Dict = Record<string, string>;
/** English ships in the main bundle; Hindi is loaded on demand (and precached by the service worker for offline use). */
export const dicts: Record<Lang, Dict> = { en: en as Dict, hi: {} };

let hiPromise: Promise<void> | null = null;
export function loadLang(lang: Lang): Promise<void> {
  if (lang === "en" || Object.keys(dicts.hi).length) return Promise.resolve();
  hiPromise ??= import("./hi.json").then((m) => {
    dicts.hi = (m.default ?? m) as Dict;
  });
  return hiPromise;
}
