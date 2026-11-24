import { useLocation, useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { useSession } from "@/store/session";
import { useT } from "@/i18n";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/Breadcrumbs";

/** Shows a friendly sign-in prompt instead of a blank screen when no citizen is signed in. */
export function RequireCitizen({ title, children }: { title: string; children: React.ReactNode }) {
  const id = useSession((s) => s.citizenId);
  const { t } = useT();
  const nav = useNavigate();
  const loc = useLocation();
  if (id) return <>{children}</>;
  return (
    <div>
      <PageHeader title={title} crumbs={[{ label: title }]} />
      <EmptyState
        title={t("auth.required")}
        body={t("auth.required_sub")}
        action={
          <Button size="lg" onClick={() => nav(`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`)}>
            <LogIn aria-hidden /> {t("header.sign_in")}
          </Button>
        }
      />
    </div>
  );
}
