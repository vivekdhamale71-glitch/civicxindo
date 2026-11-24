import { useSettings } from "@/store/settings";
import type { L10n, Lang } from "@/lib/types";
import { useCallback } from "react";
import { dicts } from "./dicts";

export function translate(lang: Lang, key: string, vars?: Record<string, string | number>) {
  let s = dicts[lang][key] ?? dicts.en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

/** t("key", vars) for UI strings; L(obj) for bilingual data fields. */
export function useT() {
  const lang = useSettings((s) => s.lang);
  const t = useCallback((key: string, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);
  const L = useCallback((v: L10n | undefined | null) => (v ? v[lang] || v.en : ""), [lang]);
  return { t, L, lang };
}
