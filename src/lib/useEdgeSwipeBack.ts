import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/** Swipe from the left edge to go back (detail pages). */
export function useEdgeSwipeBack(enabled = true, fallback = "/") {
  const nav = useNavigate();
  useEffect(() => {
    if (!enabled) return;
    let sx = 0, sy = 0, tracking = false;
    const start = (e: TouchEvent) => {
      const t = e.touches[0];
      tracking = t.clientX < 24;
      sx = t.clientX;
      sy = t.clientY;
    };
    const end = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - sx, dy = Math.abs(t.clientY - sy);
      if (dx > 80 && dy < 60) {
        if (window.history.state?.idx > 0) nav(-1);
        else nav(fallback);
      }
    };
    window.addEventListener("touchstart", start, { passive: true });
    window.addEventListener("touchend", end, { passive: true });
    return () => {
      window.removeEventListener("touchstart", start);
      window.removeEventListener("touchend", end);
    };
  }, [enabled, nav, fallback]);
}
