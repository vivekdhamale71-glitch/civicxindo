import { useState } from "react";
import images from "@/data/scheme-images.json";
import type { Category } from "@/lib/types";
import { Illustration } from "./Illustration";
import { asset, cn } from "@/lib/utils";

type Meta = { src: string; placeholder: string; title: string; artist: string; license: string; licenseUrl: string; source: string };
export const SCHEME_IMAGES = images as Record<string, Meta>;

/** Photo for a scheme (freely licensed, see Image credits) with a blurred placeholder; falls back to the category illustration. */
export function SchemePhoto({ schemeId, category, className, eager }: { schemeId: string; category: Category; className?: string; eager?: boolean }) {
  // Revisions ("rev-kaushal") reuse the live scheme's photo.
  const meta = SCHEME_IMAGES[schemeId] ?? SCHEME_IMAGES[schemeId.replace(/^rev-/, "sch-")];
  const [loaded, setLoaded] = useState(false);
  if (!meta) return <Illustration category={category} className={cn("h-full w-full", className)} />;
  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-ink/[0.06]", className)}>
      <img src={meta.placeholder} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover blur-xl" />
      <img
        src={asset(meta.src)}
        alt=""
        width={800}
        height={450}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={cn("absolute inset-0 h-full w-full object-cover transition-opacity duration-500", loaded ? "opacity-100" : "opacity-0")}
      />
      {/* Soft bottom fade keeps overlaid badges legible on any photo. */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent" />
    </div>
  );
}
