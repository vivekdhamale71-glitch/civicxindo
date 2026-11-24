import { useQuery } from "@tanstack/react-query";
import { Phone, Mail } from "lucide-react";
import { PLink } from "../PLink";
import { useT } from "@/i18n";
import { visitorCount } from "@/api/admin";
import { formatDate, groupIN } from "@/lib/utils";
import { Wheel } from "../brand/Wheel";

export const FOOTER_PAGES = ["about", "help", "contact", "feedback", "sitemap", "terms", "privacy", "copyright", "hyperlinking", "accessibility", "disclaimer", "image-credits"] as const;

export function Footer() {
  const { t, lang } = useT();
  const { data: visitors } = useQuery({ queryKey: ["visitors"], queryFn: visitorCount, staleTime: Infinity });
  return (
    <footer className="relative mt-16 bg-navy text-white/80 dark:bg-[#0A101D]">
      <div className="tricolour" aria-hidden />
      <div className="container-x py-12 pb-28 md:pb-12">
        <div className="grid gap-8 md:grid-cols-[1.2fr_2fr]">
          <div>
            <div className="flex items-center gap-3 text-white">
              <Wheel size={40} />
              <div>
                <p className="text-lg font-bold">civicXindo</p>
                <p className="text-xs text-white/70">National Welfare Schemes Portal | <span lang="hi">राष्ट्रीय कल्याण योजना पोर्टल</span></p>
              </div>
            </div>
            <p className="mt-4 max-w-[42ch] text-sm">{t("footer.owned")}</p>
            <div className="mt-4 space-y-2 text-sm">
              <p className="flex items-center gap-2"><Phone className="size-4" aria-hidden /> {t("footer.helpline")}: <span className="num font-semibold text-white">1800-000-0000</span> ({t("footer.tollfree")})</p>
              <p className="flex items-center gap-2"><Mail className="size-4" aria-hidden /> helpdesk@civicxindo.example</p>
            </div>
          </div>
          <nav aria-label={t("footer.nav")}>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
              {FOOTER_PAGES.map((p) => (
                <li key={p}>
                  <PLink to={`/info/${p}`} className="inline-flex min-h-[36px] items-center rounded hover:text-white hover:underline focus-visible:outline-white">
                    {t(`page.${p}.title`)}
                  </PLink>
                </li>
              ))}
              <li>
                <PLink to="/screen-reader-access" className="inline-flex min-h-[36px] items-center rounded hover:text-white hover:underline focus-visible:outline-white">{t("strip.screen_reader")}</PLink>
              </li>
              <li>
                <PLink to="/gov/login" className="inline-flex min-h-[36px] items-center rounded hover:text-white hover:underline focus-visible:outline-white">{t("nav.officials")}</PLink>
              </li>
            </ul>
          </nav>
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs md:flex-row md:items-center md:justify-between">
          <p>
            {t("footer.last_updated")}: <span className="num">{formatDate(__BUILD_DATE__, lang)}</span>
            <span className="mx-2 opacity-40">·</span>
            {t("footer.visitors")}: <span className="num font-semibold text-white">{visitors ? groupIN(visitors) : "—"}</span>
          </p>
          <p className="font-semibold text-saffron">{t("footer.demo")}</p>
        </div>
      </div>
    </footer>
  );
}
