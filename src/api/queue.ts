import { db } from "@/db";
import type { QueuedSubmission } from "@/lib/types";
import { changed, local } from "./client";
import { createApplication, type SubmitPayload } from "./applications";
import { createGrievance, type GrievancePayload } from "./grievances";
import { uid } from "@/lib/utils";

export const listQueued = () => local(() => db.queue.orderBy("createdAt").toArray());

export async function enqueue(kind: QueuedSubmission["kind"], payload: unknown, label: string) {
  await db.queue.add({ id: uid("q-"), kind, payload, label, createdAt: new Date().toISOString() });
  changed();
  // Ask the service worker to wake us when connectivity returns (Background Sync).
  try {
    const reg = (await navigator.serviceWorker?.ready) as ServiceWorkerRegistration & { sync?: { register(tag: string): Promise<void> } };
    await reg?.sync?.register("cx-queue");
  } catch {
    /* Background Sync unsupported: the `online` listener is the fallback */
  }
}

let flushing: Promise<number> | null = null;
/** Sends every queued submission. Returns the number sent. Safe to call repeatedly. */
export function flushQueue(): Promise<number> {
  if (flushing) return flushing;
  flushing = (async () => {
    if (!navigator.onLine) return 0;
    const items = await db.queue.orderBy("createdAt").toArray();
    let sent = 0;
    for (const item of items) {
      try {
        if (item.kind === "application") await createApplication(item.payload as SubmitPayload);
        else await createGrievance(item.payload as GrievancePayload);
        await db.queue.delete(item.id);
        sent++;
      } catch {
        break;
      }
    }
    if (sent) changed();
    return sent;
  })().finally(() => setTimeout(() => (flushing = null), 0));
  return flushing;
}
