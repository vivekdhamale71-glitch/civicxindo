import { Badge } from "./ui/misc";
import type { Application } from "@/lib/types";
import { STAGE_LABELS } from "@/lib/reference";
import { useT } from "@/i18n";

export function appTone(a: Pick<Application, "stage" | "status">) {
  if (a.status === "rejected") return "rejected" as const;
  if (a.status === "sent_back") return "review" as const;
  if (a.stage === "credited" || a.stage === "sanctioned") return "approved" as const;
  if (a.stage === "submitted") return "info" as const;
  return "review" as const;
}

export function StatusBadge({ app }: { app: Pick<Application, "stage" | "status"> }) {
  const { t, L } = useT();
  const label = app.status === "rejected" ? t("status.rejected") : app.status === "sent_back" ? t("status.sent_back") : L(STAGE_LABELS[app.stage]);
  return (
    <Badge tone={appTone(app)} dot>
      {label}
    </Badge>
  );
}
