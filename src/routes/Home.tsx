import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { m } from "motion/react";
import { ArrowRight, ClipboardCheck, FileText, Search, ShieldCheck, ListChecks, Megaphone, ChartColumn, Building2 } from "lucide-react";
import { listSchemes } from "@/api/schemes";
import { homeStats } from "@/api/stats";
import { useT } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Badge, Card, IconTint } from "@/components/ui/misc";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { SchemeCard, SchemeCardSkeleton } from "@/features/schemes/SchemeCard";
import { NOTICES, noticeDate } from "@/features/notices";
import { PLink } from "@/components/PLink";
import { Reveal } from "@/components/Reveal";
import { Wheel } from "@/components/brand/Wheel";
import { compactINR, formatDate, groupIN } from "@/lib/utils";
import { spring, ease } from "@/lib/motion";
import { preload } from "@/app/lazy";
import { useMounted } from "@/lib/hooks";
import { InstallButton } from "@/components/InstallButton";
import { Smartphone, WifiOff as WifiOffIcon, Zap } from "lucide-react";

export default function Home() {
  const { t, L, lang } = useT();
  const nav = useNavigate();
  const mounted = useMounted();
  const schemes = useQuery({ queryKey: ["schemes"], queryFn: listSchemes });
  const stats = useQuery({ queryKey: ["home-stats"], queryFn: homeStats });
  const featured = schemes.data?.filter((s) => s.featured && s.status === "published").slice(0, 3) ?? [];

  // CSS entrance (runs without waiting for JavaScript animation features), staggered 80 ms.
  const heroItem = (i: number) => ({ className: "hero-in", style: { animationDelay: `${80 * i}ms` } });

  return (
    <div className="space-y-12 md:space-y-16">
      {/* Hero */}
      <section className="grain relative -mx-4 overflow-hidden px-4 py-12 md:mx-0 md:rounded-sheet md:border md:border-line/[0.06] md:px-12 md:py-16" aria-labelledby="hero-title">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-[10%] -top-[30%] h-[80%] w-[60%] animate-drift rounded-full bg-saffron opacity-[0.06] blur-3xl" />
          <div className="absolute -right-[10%] bottom-[-30%] h-[80%] w-[60%] animate-drift rounded-full bg-green opacity-[0.05] blur-3xl [animation-delay:-10s]" />
          <div className="absolute left-[30%] top-[10%] h-[60%] w-[40%] rounded-full bg-white opacity-[0.05] blur-3xl" />
          <div className="absolute -right-24 top-1/2 -translate-y-1/2 text-ink opacity-[0.04] md:-right-10">
            <div className="animate-wheel">
              <Wheel size={420} strokeWidth={1} />
            </div>
          </div>
        </div>
        <div className="relative max-w-[640px]">
          <p style={heroItem(0).style} className="hero-in mb-4 inline-flex items-center gap-2 rounded-full border border-line/[0.1] bg-card/70 px-3 py-1 text-xs font-semibold text-ink">
            <span className="size-1.5 rounded-full bg-green" aria-hidden />
            {t("home.eyebrow")}
          </p>
          <h1 style={heroItem(1).style} id="hero-title" className="hero-in text-display text-ink">
            {t("home.hero")}
          </h1>
          {lang === "en" && (
            <p style={heroItem(2).style} lang="hi" className="hero-in mt-2 text-[1.6rem] font-semibold leading-tight text-ink/70 md:text-[2rem]">
              हर योजना, एक जगह
            </p>
          )}
          <p style={heroItem(3).style} className="hero-in mt-4 max-w-[52ch] text-[17px] text-body">
            {t("home.hero_sub")}
          </p>
          <div style={heroItem(4).style} className="hero-in mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" hapticTick onMouseEnter={() => preload("/eligibility")} onTouchStart={() => preload("/eligibility")} onClick={() => nav("/eligibility")}>
              <ClipboardCheck aria-hidden /> {t("home.cta")}
            </Button>
            <Button size="lg" variant="secondary" onMouseEnter={() => preload("/schemes")} onClick={() => nav("/schemes")}>
              {t("home.browse")} <ArrowRight aria-hidden />
            </Button>
          </div>
        </div>
      </section>

      {/* Live stats */}
      <section aria-label={t("home.stats")}>
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {[
            { icon: FileText, label: t("home.stat_schemes"), value: stats.data?.schemes, fmt: groupIN },
            { icon: ListChecks, label: t("home.stat_beneficiaries"), value: stats.data?.beneficiaries, fmt: groupIN },
            { icon: ChartColumn, label: t("home.stat_disbursed"), value: stats.data?.disbursed, fmt: (n: number) => compactINR(n, lang) },
          ].map((s, i) => (
            <Reveal key={s.label} i={i}>
              <Card className="flex h-full flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-4 md:p-6">
                <IconTint size={48} className="hidden sm:inline-flex"><s.icon className="size-5" aria-hidden /></IconTint>
                <s.icon className="size-4 text-muted sm:hidden" aria-hidden />
                <div className="min-w-0">
                  <p className="text-[17px] font-bold leading-tight tracking-[-0.01em] text-ink sm:whitespace-nowrap sm:text-2xl lg:text-[26px]">
                    {s.value === undefined ? <span className="skeleton inline-block h-5 w-16 align-middle sm:h-7 sm:w-28" /> : <AnimatedNumber value={s.value} format={s.fmt} />}
                  </p>
                  <p className="mt-0.5 text-xs leading-snug text-muted sm:text-sm">{s.label}</p>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Get the app (PWA install) */}
      <Reveal as="section">
        <div className="card relative overflow-hidden p-6 md:flex md:items-center md:gap-8 md:p-8" aria-labelledby="app-title">
          <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 text-ink opacity-[0.05]"><Wheel size={220} strokeWidth={1} /></div>
          <div className="relative flex-1">
            <h2 id="app-title" className="t-scale text-2xl font-semibold">{t("install.get_title")}</h2>
            <p className="mt-1 max-w-[52ch] text-body">{t("install.get_sub")}</p>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink">
              <li className="flex items-center gap-2"><Zap className="size-4" aria-hidden />{t("install.fast")}</li>
              <li className="flex items-center gap-2"><WifiOffIcon className="size-4" aria-hidden />{t("install.offline")}</li>
              <li className="flex items-center gap-2"><Smartphone className="size-4" aria-hidden />{t("install.native")}</li>
            </ul>
          </div>
          <InstallButton className="relative mt-6 w-full md:mt-0 md:w-auto" />
        </div>
      </Reveal>

      {/* Featured schemes */}
      <section aria-labelledby="featured-title">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 id="featured-title" className="t-scale text-2xl font-semibold">{t("home.featured")}</h2>
            <p className="text-body">{t("home.featured_sub")}</p>
          </div>
          <PLink to="/schemes" className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-info hover:underline sm:flex">
            {t("home.view_all")} <ArrowRight className="size-4" aria-hidden />
          </PLink>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {schemes.isLoading ? [0, 1, 2].map((i) => <SchemeCardSkeleton key={i} />) : featured.map((s, i) => <SchemeCard key={s.id} s={s} i={i} />)}
        </div>
        <PLink to="/schemes" className="mt-4 flex items-center justify-center gap-1 py-2 text-sm font-semibold text-info sm:hidden">
          {t("home.view_all")} <ArrowRight className="size-4" aria-hidden />
        </PLink>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        {/* Notices and circulars */}
        <section aria-labelledby="notices-title">
          <h2 id="notices-title" className="t-scale mb-4 flex items-center gap-2 text-2xl font-semibold">
            <Megaphone className="size-6" aria-hidden /> {t("home.notices")}
          </h2>
          <Card as="section" className="divide-y divide-line/[0.08]">
            {NOTICES.map((n, i) => (
              <Reveal key={n.id} i={i} className="flex gap-4 p-4">
                <time dateTime={mounted ? noticeDate(n) : undefined} className="num w-20 shrink-0 text-xs font-semibold uppercase text-muted">
                  {mounted ? formatDate(noticeDate(n), lang) : "\u00a0"}
                </time>
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap gap-2">
                    {n.daysAgo <= 7 && <Badge tone="rejected">{t("home.new")}</Badge>}
                    <Badge tone="neutral">{t(`home.kind_${n.kind}`)}</Badge>
                  </div>
                  <p className="text-[15px] text-ink">{L(n.title)}</p>
                </div>
              </Reveal>
            ))}
          </Card>
        </section>

        {/* Quick services */}
        <section aria-labelledby="services-title">
          <h2 id="services-title" className="t-scale mb-4 text-2xl font-semibold">{t("home.services")}</h2>
          <div className="grid gap-3">
            {[
              { to: "/track", icon: ListChecks, title: t("home.svc_track"), body: t("home.svc_track_sub") },
              { to: "/verify", icon: ShieldCheck, title: t("home.svc_verify"), body: t("home.svc_verify_sub") },
              { to: "/open-data", icon: ChartColumn, title: t("home.svc_data"), body: t("home.svc_data_sub") },
              { to: "/gov/login", icon: Building2, title: t("home.svc_officials"), body: t("home.svc_officials_sub") },
            ].map((x, i) => (
              <Reveal key={x.to} i={i}>
                <m.div whileTap={{ scale: 0.97 }} whileHover={{ y: -1 }} transition={spring.snappy}>
                  <PLink to={x.to} className="card flex items-center gap-4 p-4 hover:border-line/[0.14]">
                    <IconTint><x.icon className="size-5" aria-hidden /></IconTint>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-ink">{x.title}</span>
                      <span className="block text-sm text-muted">{x.body}</span>
                    </span>
                    <ArrowRight className="size-4 text-muted" aria-hidden />
                  </PLink>
                </m.div>
              </Reveal>
            ))}
          </div>
        </section>
      </div>

      {/* How it works */}
      <section aria-labelledby="how-title">
        <h2 id="how-title" className="t-scale mb-6 text-2xl font-semibold">{t("home.how")}</h2>
        <ol className="relative grid gap-4 md:grid-cols-4">
          <m.span
            aria-hidden
            className="absolute left-6 right-6 top-6 hidden h-px origin-left bg-line/[0.15] md:block"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.8, ease: ease.out }}
          />
          {[Search, ClipboardCheck, FileText, ListChecks].map((Icon, i) => (
            <Reveal as="li" key={i} i={i} className="relative">
              <div className="flex size-12 items-center justify-center rounded-full border border-line/[0.1] bg-card text-ink shadow-card">
                <Icon className="size-5" aria-hidden />
              </div>
              <p className="num mt-4 text-xs font-semibold uppercase tracking-wider text-muted">{t("home.step", { n: i + 1 })}</p>
              <h3 className="t-scale mt-1 text-lg font-semibold">{t(`home.how${i + 1}`)}</h3>
              <p className="mt-1 text-sm text-body">{t(`home.how${i + 1}_sub`)}</p>
            </Reveal>
          ))}
        </ol>
      </section>
    </div>
  );
}
