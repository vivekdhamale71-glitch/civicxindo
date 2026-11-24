import { FileText } from "lucide-react";
import { useObjectUrl } from "@/lib/hooks";
import type { WalletDoc } from "@/lib/types";
import { cn } from "@/lib/utils";

export function DocThumb({ doc, className }: { doc: WalletDoc; className?: string }) {
  const isImg = doc.mime.startsWith("image/");
  const url = useObjectUrl(isImg ? doc.blob : null);
  return (
    <div className={cn("relative overflow-hidden rounded-input bg-ink/[0.05]", className)}>
      {isImg && url ? (
        <img src={url} alt="" width={160} height={100} loading="lazy" decoding="async" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted"><FileText className="size-8" aria-hidden /></div>
      )}
    </div>
  );
}
