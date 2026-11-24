import { Suspense, useRef } from "react";
import { Outlet, useLocation, useNavigationType } from "react-router-dom";
import { m, useReducedMotion } from "motion/react";
import { TopStrip } from "@/components/shell/TopStrip";
import { Header } from "@/components/shell/Header";
import { Footer } from "@/components/shell/Footer";
import { TabBar } from "@/components/shell/TabBar";
import { Sidebar } from "@/components/shell/Sidebar";
import { isTabRoot } from "@/components/shell/nav";
import { useUI } from "@/store/ui";
import { useIsDesktop } from "@/lib/hooks";
import { spring, ease } from "@/lib/motion";
import { PageSkeleton } from "@/components/PageSkeleton";

/** Forward: slide in 24px from the right. Back: from the left. Tab switch: cross-fade. */
function usePageMotion() {
  const { pathname } = useLocation();
  const navType = useNavigationType();
  const prev = useRef<string | null>(null);
  const reduce = useReducedMotion();
  const from = prev.current;
  if (from !== pathname) prev.current = pathname;
  // First paint: show the page immediately (no fade from 0) so content is visible as early as possible.
  if (from === null) return { initial: false as const, animate: { opacity: 1, x: 0 }, transition: { duration: 0 } };
  if (reduce) return { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.15 } };
  if (isTabRoot(pathname) && isTabRoot(from!)) return { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2, ease: ease.out } };
  const x = navType === "POP" ? -24 : 24;
  return { initial: { opacity: 0, x }, animate: { opacity: 1, x: 0 }, transition: { ...spring.smooth, opacity: { duration: 0.25, ease: ease.out } } };
}

export function AppShell() {
  const { pathname } = useLocation();
  const sheets = useUI((s) => s.sheets);
  const desktop = useIsDesktop();
  const motionProps = usePageMotion();
  const dim = sheets > 0 && !desktop;
  // Scale around the centre of the visible viewport, not the top of a long page.
  const originRef = useRef<string>();
  if (dim) originRef.current = `50% ${window.scrollY + window.innerHeight / 2}px`;
  const origin = originRef.current;
  return (
    <>
    <a href="#main" className="sr-only-focusable fixed left-4 top-2 z-[80] rounded-input bg-card px-4 py-2 font-semibold text-ink shadow-lift">Skip to main content</a>
    <m.div
      className="min-h-screen overflow-clip bg-page"
      style={origin ? { transformOrigin: origin } : undefined}
      animate={{ scale: dim ? 0.96 : 1, borderRadius: dim ? 24 : 0 }}
      transition={spring.smooth}
    >
      <TopStrip />
      <Header />
      <div className="container-x flex gap-8 lg:gap-12">
        <Sidebar />
        <main id="main" tabIndex={-1} className="min-w-0 flex-1 pb-8 pt-6 focus:outline-none md:pt-8">
          <Suspense fallback={<PageSkeleton />}>
            <m.div key={pathname} {...motionProps}>
              <Outlet />
            </m.div>
          </Suspense>
        </main>
      </div>
      <Footer />
    </m.div>
    <TabBar />
    </>
  );
}
