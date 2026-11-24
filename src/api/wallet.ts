import { db } from "@/db";
import type { DocType, WalletDoc } from "@/lib/types";
import { DOC_TYPES } from "@/lib/reference";
import { changed, local } from "./client";
import { DAY, uid } from "@/lib/utils";

export const listDocs = (ownerId: string) =>
  local(async () => (await db.documents.where("ownerId").equals(ownerId).toArray()).sort((a, b) => b.addedAt.localeCompare(a.addedAt)));

/** Simple on-device type detection from the file name, with a sensible fallback. */
export function detectType(name: string, hint?: DocType): DocType {
  const n = name.toLowerCase();
  for (const [type, meta] of Object.entries(DOC_TYPES) as [DocType, (typeof DOC_TYPES)[DocType]][]) {
    if (meta.keywords.some((k) => n.includes(k))) return type;
  }
  if (hint) return hint;
  if (/\.(jpe?g|png|webp|heic)$/.test(n)) return "aadhaar";
  return "other";
}

export const addDoc = (ownerId: string, file: File | Blob, name: string, type: DocType) =>
  local(async () => {
    const v = DOC_TYPES[type].validityDays;
    const doc: WalletDoc = {
      id: uid("doc-"), ownerId, type, name, mime: file.type || "application/octet-stream", blob: file, size: file.size,
      addedAt: new Date().toISOString(), expiresAt: v ? new Date(Date.now() + v * DAY).toISOString() : undefined,
    };
    await db.documents.add(doc);
    changed();
    return doc;
  });

export const updateDocType = (id: string, type: DocType) =>
  local(async () => {
    const v = DOC_TYPES[type].validityDays;
    const d = await db.documents.get(id);
    await db.documents.update(id, { type, expiresAt: v && d ? new Date(new Date(d.addedAt).getTime() + v * DAY).toISOString() : undefined });
    changed();
  });

export const deleteDoc = (id: string) =>
  local(async () => {
    await db.documents.delete(id);
    changed();
  });

export type Expiry = "valid" | "soon" | "expired" | "none";
export function expiryState(d: WalletDoc): Expiry {
  if (!d.expiresAt) return "none";
  const left = new Date(d.expiresAt).getTime() - Date.now();
  if (left < 0) return "expired";
  if (left < 30 * DAY) return "soon";
  return "valid";
}
