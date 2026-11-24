import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { m, AnimatePresence, useScroll, useTransform } from "motion/react";
import { Bell, Search, UserRound, LogIn } from "lucide-react";
import { Logo } from "../brand/Logo";
import { useT } from "@/i18n";
import { listSchemes } from "@/api/schemes";
import { listNotifications } from "@/api/notifications";
import { useSession } from "@/store/session";
import { PLink } from "../PLink";
import { LazySheet as Sheet } from "../ui/lazy-sheet";
import { NotificationList } from "../NotificationList";
import { InstallButton } from "../InstallButton";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function Header() {
  const { t } = useT();
  const citizenId = useSession((s) => s.citizenId);
  const [searchOpen, setSearchOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const { scrollY } = useScroll();
  const shadow = useTransform(scrollY, [0, 48], [0, 1]);
  const { data: notes } = useQuery({ queryKey: ["notifications", citizenId], queryFn: () => listNotifications(citizenId!), enabled: !!citizenId });
  const unread = notes?.filter((n) => !n.read).length ?? 0;

  return (
    <header className="sticky top-0 z-40">
      <div className="glass relative border-b border-line/[0.06]">
        {/* Pre-rendered shadow layer: only its opacity changes on scroll. */}
        <m.div aria-hidden className="pointer-events-none absolute inset-0 shadow-[0_8px_24px_-12px_rgba(27,42,74,.25)]" style={{ opacity: shadow }} />
        <div className="container-x relative flex h-16 items-center gap-4 md:h-[72px]">
          <Logo />
          <div className="ml-auto hidden max-w-[440px] flex-1 md:block">
            <SearchBox />
          </div>
          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <InstallButton variant="header" className="mr-1 hidden lg:inline-flex" />
            <InstallButton variant="icon" className="lg:hidden" />
            <button className="flex size-11 items-center justify-center rounded-full text-ink hover:bg-ink/[0.06] md:hidden" onClick={() => setSearchOpen(true)} aria-label={t("header.search")}>
              <Search className="size-5" />
            </button>
            {citizenId && (
              <button className="relative flex size-11 items-center justify-center rounded-full text-ink hover:bg-ink/[0.06]" onClick={() => setBellOpen(true)} aria-label={t("header.notifications", { n: unread })}>
                <Bell className="size-5" />
                <AnimatePresence>
                  {unread > 0 && (
                    <m.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="num absolute right-1.5 top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rejected px-1 text-[10px] font-bold text-white">
                      {unread}
                    </m.span>
                  )}
                </AnimatePresence>
              </button>
            )}
            <PLink to={citizenId ? "/profile" : "/login"} className="hidden items-center gap-2 rounded-input px-3 py-2 text-sm font-semibold text-ink hover:bg-ink/[0.06] md:flex">
              {citizenId ? <UserRound className="size-[18px]" /> : <LogIn className="size-[18px]" />}
              {citizenId ? t("nav.profile") : t("header.sign_in")}
            </PLink>
          </div>
        </div>
        <div className="tricolour" aria-hidden />
      </div>
      <Sheet open={searchOpen} onOpenChange={setSearchOpen} title={t("header.search")}>
        <SearchBox autoFocus onDone={() => setSearchOpen(false)} />
      </Sheet>
      <Sheet open={bellOpen} onOpenChange={setBellOpen} title={t("notif.title")}>
        {citizenId && <NotificationList userId={citizenId} onNavigate={() => setBellOpen(false)} />}
      </Sheet>
    </header>
  );
}

function SearchBox({ autoFocus, onDone }: { autoFocus?: boolean; onDone?: () => void }) {
  const { t, L } = useT();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [focus, setFocus] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data } = useQuery({ queryKey: ["schemes"], queryFn: listSchemes });
  const hits = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s || !data) return [];
    return data.filter((x) => `${x.name.en} ${x.name.hi} ${x.tagline.en} ${x.category}`.toLowerCase().includes(s)).slice(0, 5);
  }, [q, data]);
  const go = (path: string) => {
    setQ("");
    inputRef.current?.blur();
    onDone?.();
    nav(path);
  };
  return (
    <form
      role="search"
      className="relative"
      onSubmit={(e) => {
        e.preventDefault();
        go(`/schemes?q=${encodeURIComponent(q.trim())}`);
      }}
    >
      <label htmlFor={autoFocus ? "search-m" : "search-d"} className="sr-only">{t("header.search")}</label>
      <Search className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted" aria-hidden />
      <input
        ref={inputRef}
        id={autoFocus ? "search-m" : "search-d"}
        type="search"
        autoFocus={autoFocus}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setTimeout(() => setFocus(false), 150)}
        placeholder={t("header.search_placeholder")}
        className="input rounded-full bg-card/80 pl-11"
        autoComplete="off"
        aria-autocomplete="list"
        aria-controls="search-results"
      />
      <AnimatePresence>
        {(focus || autoFocus) && hits.length > 0 && (
          <m.ul
            id="search-results"
            role="listbox"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: ease.out }}
            className={cn("z-50 mt-2 overflow-hidden rounded-card border border-line/[0.08] bg-card shadow-lift", !autoFocus && "absolute inset-x-0 top-full")}
          >
            {hits.map((h) => (
              <li key={h.id} role="option" aria-selected={false}>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => go(`/schemes/${h.id}`)} className="block w-full px-4 py-3 text-left hover:bg-ink/[0.04]">
                  <span className="block font-semibold text-ink">{L(h.name)}</span>
                  <span className="block truncate text-sm text-muted">{L(h.tagline)}</span>
                </button>
              </li>
            ))}
          </m.ul>
        )}
      </AnimatePresence>
    </form>
  );
}
