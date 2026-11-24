import { useEffect } from "react";

/**
 * The splash itself is static HTML/CSS in index.html so it paints before any JavaScript.
 * Once the app has mounted (and the 1.1 s signature animation has played) it fades out and is removed.
 */
export function Splash({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const el = document.getElementById("splash");
    if (!el) {
      onDone();
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = (window as unknown as { __splashStart?: number }).__splashStart ?? 0;
    const remaining = Math.max(0, (reduce ? 200 : 1150) - (performance.now() - start));
    let removed = false;
    const finish = () => {
      if (removed) return;
      removed = true;
      el.classList.add("out");
      setTimeout(() => {
        el.remove();
        onDone();
      }, 300);
    };
    const t = setTimeout(finish, remaining);
    el.addEventListener("click", finish, { once: true });
    return () => clearTimeout(t);
  }, [onDone]);
  return null;
}
