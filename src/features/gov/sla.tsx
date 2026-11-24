import { Badge } from "@/components/ui/misc";
import { useT } from "@/i18n";
import { daysLeft } from "@/lib/utils";
import type { Application } from "@/lib/types";

export function SlaBadge({ app }: { app: Application }) {
  const { t } = useT();
  const d = daysLeft(app.dueAt);
  if (d < 0) return <Badge tone="rejected">{t(-d === 1 ? "gov.overdue_1" : "gov.overdue", { n: -d })}</Badge>;
  if (d <= 3) return <Badge tone="review">{t(d === 1 ? "gov.days_left_1" : "gov.days_left", { n: d })}</Badge>;
  return <Badge tone="neutral">{t(d === 1 ? "gov.days_left_1" : "gov.days_left", { n: d })}</Badge>;
}

export const isClean = (a: Application) => a.flags.every((f) => f.status === "cleared") && a.autoChecks.every((c) => c.ok);
