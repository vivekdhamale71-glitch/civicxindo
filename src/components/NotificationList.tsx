import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { m } from "motion/react";
import { BellOff } from "lucide-react";
import { listNotifications, markAllRead, markRead } from "@/api/notifications";
import { useT } from "@/i18n";
import { formatDate, cn } from "@/lib/utils";
import { fadeUp } from "@/lib/motion";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/misc";

export function NotificationList({ userId, limit, onNavigate }: { userId: string; limit?: number; onNavigate?: () => void }) {
  const { t, L, lang } = useT();
  const nav = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ["notifications", userId], queryFn: () => listNotifications(userId) });
  const all = useMutation({ mutationFn: () => markAllRead(userId) });
  const list = limit ? data?.slice(0, limit) : data;
  if (isLoading) return <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>;
  if (!list?.length)
    return (
      <div className="flex flex-col items-center py-8 text-center text-muted">
        <BellOff className="size-8" aria-hidden />
        <p className="mt-2">{t("notif.empty")}</p>
      </div>
    );
  return (
    <div>
      {!limit && data!.some((n) => !n.read) && (
        <div className="mb-2 flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => all.mutate()}>{t("notif.mark_all")}</Button>
        </div>
      )}
      <ul className="divide-y divide-line/[0.08]" aria-live="polite">
        {list.map((n, i) => (
          <m.li key={n.id} variants={fadeUp} initial="hidden" animate="show" custom={i}>
            <button
              className="flex w-full gap-3 rounded-input px-2 py-3 text-left hover:bg-ink/[0.04]"
              onClick={() => {
                markRead(n.id);
                onNavigate?.();
                if (n.link) nav(n.link);
              }}
            >
              <span className={cn("mt-2 size-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-info")} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className={cn("block text-ink", !n.read && "font-semibold")}>{L(n.title)}</span>
                <span className="block text-sm text-body">{L(n.body)}</span>
                <span className="mt-0.5 block text-xs text-muted">{formatDate(n.at, lang, true)}</span>
              </span>
              {!n.read && <span className="sr-only">{t("notif.unread")}</span>}
            </button>
          </m.li>
        ))}
      </ul>
    </div>
  );
}
