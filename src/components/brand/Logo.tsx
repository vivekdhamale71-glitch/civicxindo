import { Link } from "react-router-dom";
import { Wheel } from "./Wheel";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex min-w-0 items-center gap-3 rounded-input">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ink/[0.06] text-ink md:size-12">
        <Wheel size={34} />
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block text-lg font-bold tracking-[-0.01em] text-ink md:text-xl">
          civic<span className="text-[#E07B12] dark:text-saffron">X</span>indo
        </span>
        <span className="sr-only">, home</span>
        {!compact && (
          <span className="block truncate text-[11px] text-muted md:text-xs">
            National Welfare Schemes Portal <span className="hidden sm:inline">| <span lang="hi">राष्ट्रीय कल्याण योजना पोर्टल</span></span>
          </span>
        )}
      </span>
    </Link>
  );
}
