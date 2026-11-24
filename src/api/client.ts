import type { QueryClient } from "@tanstack/react-query";
import { db, getMeta, setMeta } from "@/db";
import type { AuditEntry, L10n, Notice } from "@/lib/types";
import { asset, BASE, latency, uid } from "@/lib/utils";
import { useSettings } from "@/store/settings";
import { useSession } from "@/store/session";

let qc: QueryClient | null = null;
const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("civicxindo") : null;

export function bindQueryClient(client: QueryClient) {
  qc = client;
  channel?.addEventListener("message", (e) => {
    if (e.data?.type === "changed") client.invalidateQueries();
  });
}

/** Call after every write: refreshes this tab and any other open tab (connected state). */
export function changed() {
  qc?.invalidateQueries();
  channel?.postMessage({ type: "changed" });
}

let seeding: Promise<void> | null = null;
export function ensureSeeded() {
  if (!seeding) {
    seeding = (async () => {
      const { SEED_VERSION, seedDatabase } = await import("@/db/seed");
      const v = await getMeta<number>("seedVersion", 0);
      if (v !== SEED_VERSION) {
        await db.delete();
        await db.open();
        await seedDatabase();
      }
      const visitors = await getMeta<number>("visitors", 14_823_917);
      await setMeta("visitors", visitors + 1);
    })();
  }
  return seeding;
}

/** Fake network: wait 300–600 ms, after the database is ready. */
export async function net<T>(fn: () => Promise<T>): Promise<T> {
  await ensureSeeded();
  await latency();
  return fn();
}

export async function local<T>(fn: () => Promise<T>): Promise<T> {
  await ensureSeeded();
  return fn();
}

export async function audit(actor: string, role: string, action: string, target: string, detail?: string) {
  const entry: AuditEntry = { id: uid("au-"), at: new Date().toISOString(), actor, role, action, target, detail };
  await db.audit.add(entry);
}

export async function notify(userId: string, title: L10n, body: L10n, link?: string) {
  const n: Notice = { id: uid("n-"), userId, title, body, at: new Date().toISOString(), read: false, link };
  await db.notifications.add(n);
  const { notifications, lang } = useSettings.getState();
  const isMe = useSession.getState().citizenId === userId;
  if (notifications && isMe && "Notification" in window && Notification.permission === "granted") {
    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      const opts = { body: body[lang], icon: asset("icons/icon-192.png"), badge: asset("icons/icon-192.png"), tag: n.id, data: { link: link ? BASE.replace(/\/$/, "") + link : undefined } };
      if (reg) await reg.showNotification(title[lang], opts);
      else new Notification(title[lang], opts);
    } catch {
      /* notifications unavailable */
    }
  }
}
