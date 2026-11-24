import { db } from "@/db";
import type { Application, AttachedDoc, Citizen, FraudFlag, Official, Stage, TimelineEvent } from "@/lib/types";
import { audit, changed, local, net, notify } from "./client";
import { DAY, uid } from "@/lib/utils";

export interface SubmitPayload {
  schemeId: string;
  citizen: Citizen;
  answers: Record<string, string>;
  documents: AttachedDoc[];
  bankAccount: string;
  ifsc: string;
  resubmitOf?: string;
}

const ev = (kind: TimelineEvent["kind"], by: string, role: string, comment?: string, at = new Date()): TimelineEvent => ({
  id: uid("ev-"), kind, at: at.toISOString(), by, role, comment,
});

export const listMyApplications = (citizenId: string) =>
  net(async () => (await db.applications.where("citizenId").equals(citizenId).toArray()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));

export const getApplication = (id: string) => net(async () => (await db.applications.get(id)) ?? null);

async function nextRef(code: string) {
  const count = await db.applications.count();
  return `CXI/2026/${code}/00${1041 + count + Math.floor(Math.random() * 9)}`;
}

async function detectFraud(p: SubmitPayload): Promise<FraudFlag[]> {
  const flags: FraudFlag[] = [];
  const all = await db.applications.toArray();
  const sameBank = all.find((a) => a.bankAccount === p.bankAccount && a.citizenId !== p.citizen.id);
  if (sameBank)
    flags.push({ code: "shared_bank", status: "open", detail: { en: `Bank account is also used by ${sameBank.applicantName} (${sameBank.ref}).`, hi: `यह बैंक खाता ${sameBank.applicantName} (${sameBank.ref}) द्वारा भी उपयोग किया जा रहा है।` } });
  const sameId = all.find((a) => a.aadhaar === p.citizen.aadhaar && a.citizenId !== p.citizen.id);
  if (sameId)
    flags.push({ code: "duplicate_id", status: "open", detail: { en: `Aadhaar matches ${sameId.applicantName} (${sameId.ref}).`, hi: `आधार ${sameId.applicantName} (${sameId.ref}) से मेल खाता है।` } });
  return flags;
}

/** Writes an application to the "server" (IndexedDB). Used directly when online, or by the offline queue on reconnect. */
export async function createApplication(p: SubmitPayload): Promise<Application> {
  const scheme = await db.schemes.get(p.schemeId);
  if (!scheme) throw new Error("Scheme not found");
  if (p.resubmitOf) {
    const prev = await db.applications.get(p.resubmitOf);
    if (prev) {
      const updated: Application = {
        ...prev,
        answers: p.answers,
        documents: p.documents,
        bankAccount: p.bankAccount,
        ifsc: p.ifsc,
        status: "active",
        stage: "submitted",
        correctionNote: undefined,
        updatedAt: new Date().toISOString(),
        dueAt: new Date(Date.now() + 15 * DAY).toISOString(),
        timeline: [...prev.timeline, ev("resubmitted", p.citizen.name, "Applicant", "Corrections made and resubmitted.")],
      };
      await db.applications.put(updated);
      await audit(p.citizen.name, "Applicant", "resubmitted", prev.ref);
      changed();
      return updated;
    }
  }
  const flags = await detectFraud(p);
  const now = new Date();
  const app: Application = {
    id: uid("app-"),
    ref: await nextRef(scheme.code),
    schemeId: scheme.id,
    citizenId: p.citizen.id,
    applicantName: p.citizen.name,
    state: p.citizen.state,
    district: p.citizen.district,
    stage: "submitted",
    status: "active",
    submittedAt: now.toISOString(),
    updatedAt: now.toISOString(),
    dueAt: new Date(now.getTime() + 15 * DAY).toISOString(),
    amount: scheme.benefitAmount,
    answers: p.answers,
    documents: p.documents,
    bankAccount: p.bankAccount,
    ifsc: p.ifsc,
    aadhaar: p.citizen.aadhaar,
    timeline: [ev("submitted", p.citizen.name, "Applicant")],
    flags,
    autoChecks: [
      { label: { en: "Aadhaar verified", hi: "आधार सत्यापित" }, ok: !flags.some((f) => f.code === "duplicate_id") },
      { label: { en: "Bank account validated", hi: "बैंक खाता मान्य" }, ok: !flags.some((f) => f.code === "shared_bank") },
      { label: { en: "Income within limit", hi: "आय सीमा के भीतर" }, ok: true },
      { label: { en: "No duplicate application", hi: "कोई दोहरा आवेदन नहीं" }, ok: !flags.some((f) => f.code === "duplicate_id") },
      { label: { en: "Document authenticity", hi: "दस्तावेज़ प्रामाणिकता" }, ok: true },
    ],
  };
  await db.applications.add(app);
  await audit(p.citizen.name, "Applicant", "submitted", app.ref);
  changed();
  return app;
}

export const submitApplication = (p: SubmitPayload) => net(() => createApplication(p));

/** Simulated back-office: auto-verifies applications ~20 s after submission. */
export async function processPending() {
  return local(async () => {
    const pending = await db.applications.where("stage").equals("submitted").toArray();
    const due = pending.filter((a) => a.status === "active" && Date.now() - new Date(a.updatedAt).getTime() > 20_000);
    for (const a of due) {
      const scheme = await db.schemes.get(a.schemeId);
      await db.applications.update(a.id, {
        stage: "auto_verified",
        updatedAt: new Date().toISOString(),
        timeline: [...a.timeline, ev("auto_verified", "Auto-verification service", "System")],
      });
      await audit("Auto-verification service", "System", "auto_verified", a.ref);
      await notify(
        a.citizenId,
        { en: "Application auto-verified", hi: "आवेदन स्वतः सत्यापित" },
        { en: `${scheme?.name.en}: automatic checks complete. Your application is now with the district office.`, hi: `${scheme?.name.hi}: स्वचालित जाँच पूर्ण। आपका आवेदन अब ज़िला कार्यालय के पास है।` },
        `/track/${a.id}`,
      );
    }
    if (due.length) changed();
    return due.length;
  });
}

// ---------- District officer ----------

export const listQueue = () =>
  net(async () =>
    (await db.applications.where("stage").equals("auto_verified").toArray())
      .filter((a) => a.status === "active")
      .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt)),
  );

async function officerAction(appId: string, officer: Official, kind: "recommend" | "send_back" | "reject", comment?: string) {
  const a = await db.applications.get(appId);
  if (!a) throw new Error("Not found");
  const scheme = await db.schemes.get(a.schemeId);
  const name = scheme?.name ?? { en: "Scheme", hi: "योजना" };
  if (kind === "recommend") {
    await db.applications.update(appId, {
      stage: "district_verified" as Stage,
      updatedAt: new Date().toISOString(),
      timeline: [...a.timeline, ev("district_verified", officer.name, "District Officer", comment || "Documents verified. Recommended for sanction.")],
    });
    await notify(a.citizenId, { en: "District verification complete", hi: "ज़िला सत्यापन पूर्ण" }, { en: `${name.en}: your application has been recommended for sanction.`, hi: `${name.hi}: आपके आवेदन की स्वीकृति हेतु अनुशंसा की गई है।` }, `/track/${a.id}`);
  } else if (kind === "send_back") {
    await db.applications.update(appId, {
      status: "sent_back",
      correctionNote: comment,
      updatedAt: new Date().toISOString(),
      timeline: [...a.timeline, ev("sent_back", officer.name, "District Officer", comment)],
    });
    await notify(a.citizenId, { en: "Correction needed", hi: "सुधार आवश्यक" }, { en: `${name.en}: ${comment}`, hi: `${name.hi}: ${comment}` }, `/track/${a.id}`);
  } else {
    await db.applications.update(appId, {
      status: "rejected",
      rejectionReason: comment,
      updatedAt: new Date().toISOString(),
      timeline: [...a.timeline, ev("rejected", officer.name, "District Officer", comment)],
    });
    await notify(a.citizenId, { en: "Application not approved", hi: "आवेदन स्वीकृत नहीं" }, { en: `${name.en}: ${comment}`, hi: `${name.hi}: ${comment}` }, `/track/${a.id}`);
  }
  await audit(officer.name, "District Officer", kind === "recommend" ? "recommended" : kind === "send_back" ? "sent_back" : "rejected", a.ref, comment);
}

export const recommend = (id: string, o: Official, comment?: string) => net(async () => { await officerAction(id, o, "recommend", comment); changed(); });
export const sendBack = (id: string, o: Official, comment: string) => net(async () => { await officerAction(id, o, "send_back", comment); changed(); });
export const reject = (id: string, o: Official, reason: string) => net(async () => { await officerAction(id, o, "reject", reason); changed(); });
export const bulkRecommend = (ids: string[], o: Official) =>
  net(async () => {
    for (const id of ids) await officerAction(id, o, "recommend", "Clean file. Bulk recommended.");
    changed();
  });

// ---------- Fraud ----------

export const listFraud = () =>
  net(async () => (await db.applications.toArray()).filter((a) => a.flags.length > 0));

export const setFlagStatus = (appId: string, code: FraudFlag["code"], status: FraudFlag["status"], manager: Official) =>
  net(async () => {
    const a = await db.applications.get(appId);
    if (!a) return;
    await db.applications.update(appId, { flags: a.flags.map((f) => (f.code === code ? { ...f, status } : f)) });
    await audit(manager.name, "Portal Manager", status === "cleared" ? "fraud_flag_cleared" : "payment_held", a.ref, code);
    changed();
  });

// ---------- Public verification ----------

export interface VerifyResult {
  kind: "acknowledgement" | "sanction";
  ref: string;
  title: string;
  issuedTo: string;
  date: string;
  status: string;
  schemeName: { en: string; hi: string };
}

const mask = (name: string) => name.split(" ").map((p, i) => (i === 0 ? p : p[0] + ".")).join(" ");

export const verifyReference = (ref: string) =>
  net(async (): Promise<VerifyResult | null> => {
    const clean = ref.trim().toUpperCase();
    const app = await db.applications.where("ref").equals(clean).first();
    if (app) {
      const s = await db.schemes.get(app.schemeId);
      return { kind: "acknowledgement", ref: app.ref, title: "Application acknowledgement", issuedTo: mask(app.applicantName), date: app.submittedAt, status: app.status === "active" ? app.stage : app.status, schemeName: s?.name ?? { en: "", hi: "" } };
    }
    const batch = await db.batches.where("ref").equals(clean).first();
    if (batch) {
      const s = await db.schemes.get(batch.schemeId);
      return { kind: "sanction", ref: batch.ref, title: "Sanction order", issuedTo: `${batch.appIds.length} beneficiaries`, date: batch.createdAt, status: batch.status, schemeName: s?.name ?? { en: "", hi: "" } };
    }
    return null;
  });

export const getApplicationByRef = (ref: string) => local(async () => (await db.applications.where("ref").equals(ref).first()) ?? null);
