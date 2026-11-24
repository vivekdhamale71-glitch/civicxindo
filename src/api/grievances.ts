import { db } from "@/db";
import type { Grievance, Official } from "@/lib/types";
import { audit, changed, net, notify } from "./client";
import { uid } from "@/lib/utils";

export interface GrievancePayload {
  appId: string;
  citizenId: string;
  citizenName: string;
  subject: string;
  description: string;
}

export const listMyGrievances = (citizenId: string) =>
  net(async () => (await db.grievances.where("citizenId").equals(citizenId).toArray()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));

export const listAllGrievances = () => net(async () => (await db.grievances.toArray()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));

export async function createGrievance(p: GrievancePayload) {
  const count = await db.grievances.count();
  const g: Grievance = {
    id: uid("grv-"), ref: `GRV/2026/00${312 + count}`, appId: p.appId, citizenId: p.citizenId, subject: p.subject, description: p.description,
    status: "open", createdAt: new Date().toISOString(), updates: [],
  };
  await db.grievances.add(g);
  await audit(p.citizenName, "Applicant", "grievance_raised", g.ref);
  changed();
  return g;
}

export const submitGrievance = (p: GrievancePayload) => net(() => createGrievance(p));

export const updateGrievance = (id: string, status: Grievance["status"], text: string, official: Official) =>
  net(async () => {
    const g = await db.grievances.get(id);
    if (!g) return;
    await db.grievances.update(id, { status, updates: [...g.updates, { at: new Date().toISOString(), by: `${official.name} (Grievance cell)`, text }] });
    await notify(g.citizenId, { en: `Grievance ${g.ref} updated`, hi: `शिकायत ${g.ref} अद्यतन` }, { en: text, hi: text }, "/grievances");
    await audit(official.name, "Portal Manager", status === "resolved" ? "grievance_resolved" : "grievance_updated", g.ref, text);
    changed();
  });
