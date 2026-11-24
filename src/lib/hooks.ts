import { useEffect, useRef, useState } from "react";

export function useMediaQuery(q: string) {
  const [match, setMatch] = useState(() => typeof window !== "undefined" && window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [q]);
  return match;
}

export const useIsDesktop = () => useMediaQuery("(min-width: 768px)");

export function useDebounced<T>(value: T, ms = 150) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function useObjectUrl(blob?: Blob | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) return setUrl(null);
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return url;
}

/** Returns true once, the first time this component ever mounted with this key in the session. */
const seen = new Set<string>();
export function useFirstTime(key: string) {
  const ref = useRef<boolean | null>(null);
  if (ref.current === null) {
    ref.current = !seen.has(key);
    seen.add(key);
  }
  return ref.current;
}

/** False during prerender and the hydration pass; true afterwards. Use for values that depend on "now". */
export function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}
