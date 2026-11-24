import Dexie, { type Table } from "dexie";
import type {
  Application, AuditEntry, Batch, Citizen, Department, Draft, Grievance, Notice, Official, QueuedSubmission, Scheme, WalletDoc,
} from "@/lib/types";

export interface Meta {
  key: string;
  value: unknown;
}

class CivicDB extends Dexie {
  schemes!: Table<Scheme, string>;
  citizens!: Table<Citizen, string>;
  officials!: Table<Official, string>;
  departments!: Table<Department, string>;
  applications!: Table<Application, string>;
  documents!: Table<WalletDoc, string>;
  drafts!: Table<Draft, string>;
  queue!: Table<QueuedSubmission, string>;
  notifications!: Table<Notice, string>;
  audit!: Table<AuditEntry, string>;
  grievances!: Table<Grievance, string>;
  batches!: Table<Batch, string>;
  meta!: Table<Meta, string>;

  constructor() {
    super("civicxindo");
    this.version(1).stores({
      schemes: "id, status, category, level",
      citizens: "id, &mobile",
      officials: "id, role",
      departments: "id",
      applications: "id, &ref, schemeId, citizenId, stage, status, district, batchId",
      documents: "id, ownerId, type",
      drafts: "id, citizenId",
      queue: "id, createdAt",
      notifications: "id, userId, at",
      audit: "id, at, role, actor",
      grievances: "id, &ref, citizenId, appId, status",
      batches: "id, &ref, schemeId, status",
      meta: "key",
    });
  }
}

export const db = new CivicDB();

export async function getMeta<T>(key: string, fallback: T): Promise<T> {
  const row = await db.meta.get(key);
  return (row?.value as T) ?? fallback;
}
export const setMeta = (key: string, value: unknown) => db.meta.put({ key, value });
