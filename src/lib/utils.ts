import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
/** Indian digit grouping: 125000 -> 1,25,000 */
export const groupIN = (n: number) => inr.format(Math.round(n));
export const formatINR = (n: number) => `₹${groupIN(n)}`;

export function compactINR(n: number, lang: "en" | "hi" = "en") {
  if (n >= 1e7) {
    const cr = n / 1e7;
    return `₹${cr >= 100 ? groupIN(cr) : cr.toFixed(1).replace(/\.0$/, "")} ${lang === "hi" ? "करोड़" : "crore"}`;
  }
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1).replace(/\.0$/, "")} ${lang === "hi" ? "लाख" : "lakh"}`;
  return formatINR(n);
}

export function formatDate(d: string | number | Date, lang: "en" | "hi" = "en", withTime = false) {
  const date = new Date(d);
  return date.toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export const DAY = 86_400_000;
export const daysBetween = (a: number, b: number) => Math.ceil((b - a) / DAY);
export const daysLeft = (iso: string) => daysBetween(Date.now(), new Date(iso).getTime());

export function haptic(ms = 10) {
  try {
    if ("vibrate" in navigator) navigator.vibrate(ms);
  } catch {
    /* unsupported */
  }
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
export const latency = () => sleep(300 + Math.random() * 300);

export function uid(prefix = "") {
  return prefix + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
}

export const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

export const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;

export async function shareOrCopy(data: { title: string; text: string; url: string }) {
  if (navigator.share) {
    try {
      await navigator.share(data);
      return "shared" as const;
    } catch (e) {
      if ((e as Error).name === "AbortError") return "cancelled" as const;
    }
  }
  await navigator.clipboard?.writeText(data.url);
  return "copied" as const;
}

export function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

/** Base path the app is served from ("/" locally, "/civicxindo/" on GitHub Pages). */
export const BASE = import.meta.env.BASE_URL;
/** Absolute, shareable URL for an in-app route, e.g. appUrl("/verify?ref=…"). */
export const appUrl = (path: string) => `${location.origin}${BASE.replace(/\/$/, "")}${path}`;
/** URL for a file in /public, e.g. asset("icons/icon-192.png"). */
export const asset = (path: string) => `${BASE}${path.replace(/^\//, "")}`;
