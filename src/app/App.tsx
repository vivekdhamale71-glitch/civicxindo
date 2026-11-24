import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LazyMotion, MotionConfig } from "motion/react";
import { AppShell } from "./AppShell";
import { Pages } from "./lazy";
import { bindQueryClient, ensureSeeded } from "@/api/client";
import { Splash } from "@/components/shell/Splash";
import { OfflineBanner } from "@/components/shell/OfflineBanner";
import { PageSkeleton } from "@/components/PageSkeleton";
import { useSettings, applyAppearance } from "@/store/settings";

// Non-critical shell pieces load after first paint.
const PwaManager = lazy(() => import("@/pwa/PwaManager").then((m) => ({ default: m.PwaManager })));
const InstallSheet = lazy(() => import("@/components/shell/InstallSheet").then((m) => ({ default: m.InstallSheet })));
const Toaster = lazy(() => import("sonner").then((m) => ({ default: m.Toaster })));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false, networkMode: "always", retry: 1 }, mutations: { networkMode: "always" } },
});
bindQueryClient(queryClient);

// Layout animations and drag need the full feature set; it loads asynchronously so it never blocks first paint.
const loadFeatures = () => import("./motion-features").then((r) => r.default);

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}

/** Providers and routes, rendered inside a router supplied by the caller (BrowserRouter in the browser, StaticRouter when prerendering). */
export function AppCore() {
  const [ready, setReady] = useState(false);
  const theme = useSettings((s) => s.theme);
  const onSplashDone = useCallback(() => setReady(true), []);

  useEffect(() => {
    applyAppearance(useSettings.getState());
    useSettings.getState().registerVisit();
    ensureSeeded();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LazyMotion features={loadFeatures} strict>
        <MotionConfig reducedMotion="user">
          <>
            <ScrollToTop />
            <Splash onDone={onSplashDone} />
            <div data-ready={ready}>
              <Suspense fallback={<div className="container-x py-8"><PageSkeleton /></div>}>
                <Routes>
                  <Route element={<AppShell />}>
                    <Route index element={<Pages.Home />} />
                    <Route path="eligibility" element={<Pages.Eligibility />} />
                    <Route path="schemes" element={<Pages.Schemes />} />
                    <Route path="schemes/:id" element={<Pages.SchemeDetail />} />
                    <Route path="verify" element={<Pages.Verify />} />
                    <Route path="open-data" element={<Pages.OpenData />} />
                    <Route path="info/:slug" element={<Pages.InfoPage />} />
                    <Route path="screen-reader-access" element={<Pages.InfoPage />} />
                    <Route path="login" element={<Pages.Login />} />
                    <Route path="me" element={<Pages.Dashboard />} />
                    <Route path="apply/:schemeId" element={<Pages.Apply />} />
                    <Route path="track" element={<Pages.Track />} />
                    <Route path="track/:id" element={<Pages.TrackDetail />} />
                    <Route path="wallet" element={<Pages.Wallet />} />
                    <Route path="grievances" element={<Pages.Grievances />} />
                    <Route path="profile" element={<Pages.Profile />} />
                    <Route path="*" element={<Pages.NotFound />} />
                  </Route>
                  <Route path="gov/login" element={<Pages.GovLogin />} />
                  <Route path="gov" element={<Pages.GovLayout />}>
                    <Route index element={<Navigate to="/gov/login" replace />} />
                    <Route path="queue" element={<Pages.Queue />} />
                    <Route path="case/:id" element={<Pages.CaseFile />} />
                    <Route path="schemes" element={<Pages.AuthorSchemes />} />
                    <Route path="schemes/:id" element={<Pages.SchemeBuilder />} />
                    <Route path="approvals" element={<Pages.Approvals />} />
                    <Route path="sanction" element={<Pages.Sanction />} />
                    <Route path="command" element={<Pages.Command />} />
                    <Route path="audit" element={<Pages.Audit />} />
                  </Route>
                </Routes>
              </Suspense>
            </div>
            <OfflineBanner />
            {ready && (
              <Suspense fallback={null}>
                <InstallSheet />
                <PwaManager />
              </Suspense>
            )}
          </>
          {ready && (
          <Suspense fallback={null}>
            <Toaster position="top-center" theme={theme} closeButton toastOptions={{ className: "!rounded-card !font-sans" }} />
          </Suspense>
          )}
        </MotionConfig>
      </LazyMotion>
    </QueryClientProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "") || "/"}>
      <AppCore />
    </BrowserRouter>
  );
}
