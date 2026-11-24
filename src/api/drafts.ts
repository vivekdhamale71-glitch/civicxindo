import { db } from "@/db";
import type { Draft } from "@/lib/types";
import { local } from "./client";

export const draftId = (citizenId: string, schemeId: string) => `${citizenId}:${schemeId}`;
export const getDraft = (citizenId: string, schemeId: string) => local(async () => (await db.drafts.get(draftId(citizenId, schemeId))) ?? null);
export const saveDraft = (d: Draft) => db.drafts.put({ ...d, updatedAt: new Date().toISOString() });
export const deleteDraft = (citizenId: string, schemeId: string) => db.drafts.delete(draftId(citizenId, schemeId));
export const listDrafts = (citizenId: string) => local(() => db.drafts.where("citizenId").equals(citizenId).toArray());
