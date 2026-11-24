import { useNavigate } from "react-router-dom";
import { useT } from "@/i18n";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const { t } = useT();
  const nav = useNavigate();
  return <EmptyState title={t("nf.title")} body={t("nf.body")} action={<Button onClick={() => nav("/")}>{t("nf.home")}</Button>} />;
}
