import type { Category } from "@/lib/types";

const ACCENT: Record<Category, string> = {
  education: "var(--ill-saffron)",
  agriculture: "var(--ill-green)",
  pension: "var(--ill-saffron)",
  housing: "var(--ill-saffron)",
  health: "var(--ill-green)",
  women: "var(--ill-saffron)",
  skills: "var(--ill-green)",
  disability: "var(--ill-green)",
  livelihood: "var(--ill-saffron)",
};

/** Duotone category illustrations: navy linework plus one accent. Original artwork. */
export function Illustration({ category, className }: { category: Category; className?: string }) {
  const a = ACCENT[category];
  const n = "rgb(var(--ink))";
  const common = { fill: "none", stroke: n, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden style={{ ["--ill-saffron" as string]: "rgb(var(--saffron))", ["--ill-green" as string]: "rgb(var(--green))" }}>
      <rect x="0" y="0" width="160" height="100" fill={n} opacity="0.04" />
      <circle cx="132" cy="22" r="26" fill={a} opacity="0.16" />
      <line x1="10" y1="84" x2="150" y2="84" stroke={n} strokeWidth="1.5" opacity=".2" />
      {category === "education" && (
        <g>
          <path d="M44 46l36-16 36 16-36 16z" fill={a} opacity=".9" />
          <path {...common} d="M44 46l36-16 36 16-36 16z" />
          <path {...common} d="M58 53v14c0 5 10 9 22 9s22-4 22-9V53" />
          <path {...common} d="M116 46v20" />
          <circle cx="116" cy="69" r="3" fill={n} />
        </g>
      )}
      {category === "agriculture" && (
        <g>
          <path d="M30 84c10-20 30-26 50-26s40 6 50 26" fill={a} opacity=".22" />
          <path {...common} d="M30 84c10-20 30-26 50-26s40 6 50 26" />
          {[60, 80, 100].map((x) => (
            <g key={x}>
              <path {...common} d={`M${x} 70V40`} />
              <path d={`M${x} 48c-10-2-14-10-14-14 8 0 14 6 14 14zM${x} 56c10-2 14-10 14-14-8 0-14 6-14 14z`} fill={a} stroke={n} strokeWidth="1.5" />
            </g>
          ))}
        </g>
      )}
      {category === "pension" && (
        <g>
          <circle cx="66" cy="38" r="10" fill={a} opacity=".9" stroke={n} strokeWidth="2" />
          <path {...common} d="M50 84V64c0-9 7-14 16-14s16 5 16 14v20" />
          <path {...common} d="M90 84V52M90 52c0-6 4-8 8-8" />
          <rect x="100" y="56" width="26" height="18" rx="3" fill={a} opacity=".25" stroke={n} strokeWidth="2" />
          <path {...common} d="M106 65h14" />
        </g>
      )}
      {category === "housing" && (
        <g>
          <path d="M48 84V52l32-22 32 22v32z" fill={a} opacity=".2" />
          <path {...common} d="M40 56l40-28 40 28M48 84V52M112 84V52" />
          <rect x="70" y="60" width="20" height="24" rx="2" fill={a} stroke={n} strokeWidth="2" />
          <rect x="54" y="58" width="10" height="10" {...common} />
          <rect x="96" y="58" width="10" height="10" {...common} />
        </g>
      )}
      {category === "health" && (
        <g>
          <rect x="52" y="30" width="56" height="54" rx="8" fill={a} opacity=".18" stroke={n} strokeWidth="2" />
          <path d="M74 44h12v10h10v12H86v10H74V66H64V54h10z" fill={a} stroke={n} strokeWidth="2" strokeLinejoin="round" />
        </g>
      )}
      {category === "women" && (
        <g>
          <circle cx="70" cy="36" r="10" fill={a} opacity=".9" stroke={n} strokeWidth="2" />
          <path {...common} d="M52 84c0-18 8-34 18-34s18 16 18 34" />
          <circle cx="98" cy="54" r="7" fill={a} opacity=".5" stroke={n} strokeWidth="2" />
          <path {...common} d="M88 84c0-10 4-20 10-20s10 10 10 20" />
        </g>
      )}
      {category === "skills" && (
        <g>
          <circle cx="80" cy="56" r="20" fill={a} opacity=".2" stroke={n} strokeWidth="2" />
          {Array.from({ length: 8 }, (_, i) => {
            const t = (i * Math.PI) / 4;
            return <path key={i} {...common} d={`M${80 + Math.cos(t) * 20} ${56 + Math.sin(t) * 20}L${80 + Math.cos(t) * 27} ${56 + Math.sin(t) * 27}`} />;
          })}
          <circle cx="80" cy="56" r="7" fill={a} stroke={n} strokeWidth="2" />
        </g>
      )}
      {category === "disability" && (
        <g>
          <circle cx="76" cy="30" r="7" fill={a} stroke={n} strokeWidth="2" />
          <path {...common} d="M76 38v20h18l8 18" />
          <circle cx="74" cy="66" r="16" fill={a} opacity=".18" stroke={n} strokeWidth="2" />
          <path {...common} d="M76 46h14" />
        </g>
      )}
      {category === "livelihood" && (
        <g>
          <rect x="50" y="46" width="60" height="38" rx="6" fill={a} opacity=".2" stroke={n} strokeWidth="2" />
          <path {...common} d="M68 46v-8a4 4 0 014-4h16a4 4 0 014 4v8M50 62h60" />
          <rect x="74" y="58" width="12" height="8" rx="2" fill={a} stroke={n} strokeWidth="2" />
        </g>
      )}
      <g opacity=".5">
        <rect x="16" y="16" width="26" height="32" rx="3" fill="rgb(var(--card))" stroke={n} strokeWidth="1.5" />
        <path d="M21 25h16M21 31h12M21 37h14" stroke={n} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="35" cy="43" r="4" fill={a} />
      </g>
    </svg>
  );
}

/** Generic empty-state art: a document tray with a soft seal. */
export function EmptyArt({ className }: { className?: string }) {
  const n = "rgb(var(--ink))";
  return (
    <svg viewBox="0 0 160 120" className={className} aria-hidden>
      <ellipse cx="80" cy="104" rx="56" ry="6" fill={n} opacity=".06" />
      <rect x="44" y="24" width="60" height="74" rx="6" fill="rgb(var(--card))" stroke={n} strokeWidth="2" />
      <path d="M54 40h40M54 50h32M54 60h36" stroke={n} strokeWidth="2" strokeLinecap="round" opacity=".5" />
      <circle cx="104" cy="82" r="18" fill="rgb(var(--saffron))" opacity=".2" stroke={n} strokeWidth="2" />
      <path d="M96 82l6 6 10-12" stroke="rgb(var(--green))" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
