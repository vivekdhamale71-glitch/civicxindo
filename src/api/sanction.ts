import { db } from "@/db";
import type { Batch, Official } from "@/lib/types";
import { audit, changed, net, notify } from "./client";
import { sleep, uid } from "@/lib/utils";

/** Recommended applications (district verified, active, no open fraud flags) grouped by district. */
export const listRecommended = () =>
  net(async () => {
    const apps = (await db.applications.where("stage").equals("district_verified").toArray()).filter((a) => a.status === "active");
    return apps.map((a) => ({ ...a, blocked: a.flags.some((f) => f.status !== "cleared") }));
  });

export const listBatches = () => net(async () => (await db.batches.toArray()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
export const getBatch = (id: string) => net(async () => (await db.batches.get(id)) ?? null);

export const createBatch = (schemeId: string, appIds: string[], officer: Official) =>
  net(async () => {
    const scheme = await db.schemes.get(schemeId);
    if (!scheme) throw new Error("Scheme not found");
    const apps = await db.applications.bulkGet(appIds);
    const total = apps.reduce((s, a) => s + (a?.amount ?? 0), 0);
    const remaining = scheme.budget.total - scheme.budget.spent;
    if (total > remaining) throw new Error("Batch total exceeds remaining budget");
    const count = await db.batches.count();
    const batch: Batch = {
      id: uid("bat-"),
      ref: `CXI/SAN/2026/${scheme.code}/${201 + count}`,
      schemeId,
      appIds,
      total,
      createdAt: new Date().toISOString(),
      createdBy: officer.name,
      status: "created",
    };
    await db.batches.add(batch);
    for (const a of apps) {
      if (!a) continue;
      await db.applications.update(a.id, {
        stage: "sanctioned",
        batchId: batch.id,
        updatedAt: new Date().toISOString(),
        timeline: [...a.timeline, { id: uid("ev-"), kind: "sanctioned", at: new Date().toISOString(), by: officer.name, role: "Sanctioning Authority", comment: `Sanction order ${batch.ref}` }],
      });
      await notify(a.citizenId, { en: "Application sanctioned", hi: "आवेदन स्वीकृत" }, { en: `${scheme.name.en}: your application has been sanctioned. Payment will be released soon.`, hi: `${scheme.name.hi}: आपका आवेदन स्वीकृत हो गया है। भुगतान शीघ्र जारी होगा।` }, `/track/${a.id}`);
    }
    await audit(officer.name, "Sanctioning Authority", "batch_created", batch.ref, `${appIds.length} beneficiaries`);
    changed();
    return batch;
  });

/** Simulated release: credits beneficiaries one by one, calling onTick so the UI can animate each row. */
export async function releaseBatch(batchId: string, officer: Official, onTick: (appId: string) => void) {
  const batch = await db.batches.get(batchId);
  if (!batch) throw new Error("Batch not found");
  const scheme = await db.schemes.get(batch.schemeId);
  await sleep(400);
  for (const id of batch.appIds) {
    const a = await db.applications.get(id);
    if (!a) continue;
    await sleep(350);
    await db.applications.update(id, {
      stage: "credited",
      updatedAt: new Date().toISOString(),
      timeline: [...a.timeline, { id: uid("ev-"), kind: "credited", at: new Date().toISOString(), by: "Payment system (simulated)", role: "System", comment: `₹${a.amount.toLocaleString("en-IN")} credited to account ending ${a.bankAccount.slice(-4)}` }],
    });
    await notify(a.citizenId, { en: "Amount credited", hi: "राशि जमा" }, { en: `${scheme?.name.en}: ₹${a.amount.toLocaleString("en-IN")} has been credited to your bank account.`, hi: `${scheme?.name.hi}: ₹${a.amount.toLocaleString("en-IN")} आपके बैंक खाते में जमा कर दिए गए हैं।` }, `/track/${a.id}`);
    onTick(id);
  }
  if (scheme) await db.schemes.update(scheme.id, { budget: { ...scheme.budget, spent: scheme.budget.spent + batch.total }, beneficiaries: scheme.beneficiaries + batch.appIds.length });
  await db.batches.update(batchId, { status: "released", releasedAt: new Date().toISOString() });
  await audit(officer.name, "Sanctioning Authority", "batch_released", batch.ref, `₹${batch.total.toLocaleString("en-IN")}`);
  changed();
}

export const getBatchApplicants = (ids: string[]) =>
  net(async () => Object.fromEntries((await db.applications.bulkGet(ids)).filter(Boolean).map((a) => [a!.id, a!.applicantName])));
