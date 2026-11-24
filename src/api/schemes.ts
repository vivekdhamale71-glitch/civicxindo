import { db } from "@/db";
import type { Official, Scheme } from "@/lib/types";
import { audit, changed, local, net } from "./client";
import { daysLeft, uid } from "@/lib/utils";

export const isOpen = (s: Scheme) => s.status === "published" && daysLeft(s.closes) >= 0;
export const isClosingSoon = (s: Scheme) => isOpen(s) && daysLeft(s.closes) <= 7;

/** Published (and paused) schemes visible to citizens. */
export const listSchemes = () =>
  net(async () => {
    const all = await db.schemes.toArray();
    return all.filter((s) => s.status === "published" || s.status === "paused").sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
  });

/** Same as listSchemes but without fake latency (for offline-first reads like eligibility). */
export const listSchemesLocal = () => local(async () => (await db.schemes.toArray()).filter((s) => s.status === "published"));

export const getScheme = (id: string) => net(async () => (await db.schemes.get(id)) ?? null);

export const listAllSchemes = () => net(() => db.schemes.toArray());

export const listByStatus = (status: Scheme["status"]) => net(() => db.schemes.where("status").equals(status).toArray());

export function blankScheme(authorId: string): Scheme {
  const now = Date.now();
  return {
    id: uid("sch-"),
    code: "NEW",
    name: { en: "", hi: "" },
    tagline: { en: "", hi: "" },
    description: { en: "", hi: "" },
    level: "central",
    category: "education",
    department: { en: "Department of Social Welfare (demo)", hi: "समाज कल्याण विभाग (डेमो)" },
    benefits: [{ en: "", hi: "" }],
    benefitAmount: 10000,
    benefitLabel: { en: "", hi: "" },
    rules: [{ id: uid("r"), field: "income", op: "lte", value: 250000 }],
    documents: ["aadhaar", "bank"],
    fields: [],
    budget: { total: 10_00_00_000, spent: 0 },
    opens: new Date(now).toISOString(),
    closes: new Date(now + 90 * 86_400_000).toISOString(),
    faqs: [],
    status: "draft",
    authorId,
    updatedAt: new Date().toISOString(),
    previous: null,
    beneficiaries: 0,
  };
}

/** Author starts an edit of a published scheme: creates a revision record that keeps the live version for diffing. */
export const startRevision = (schemeId: string, author: Official) =>
  net(async () => {
    const live = await db.schemes.get(schemeId);
    if (!live) throw new Error("Scheme not found");
    const existing = await db.schemes.get(`rev-${schemeId.replace(/^sch-/, "")}`);
    if (existing) return existing;
    const rev: Scheme = { ...live, id: `rev-${schemeId.replace(/^sch-/, "")}`, status: "draft", authorId: author.id, previous: { ...live, previous: undefined } as Scheme, featured: false };
    await db.schemes.put(rev);
    changed();
    return rev;
  });

export const saveScheme = (s: Scheme) =>
  local(async () => {
    await db.schemes.put({ ...s, updatedAt: new Date().toISOString() });
    changed();
    return s;
  });

export const submitScheme = (s: Scheme, author: Official) =>
  net(async () => {
    await db.schemes.put({ ...s, status: "pending_approval", reviewComment: undefined, updatedAt: new Date().toISOString() });
    await audit(author.name, "Scheme Author", "scheme_submitted", s.name.en || s.id);
    changed();
  });

export const approveScheme = (id: string, approver: Official) =>
  net(async () => {
    const s = await db.schemes.get(id);
    if (!s) return;
    await db.schemes.update(id, { status: "approved", reviewComment: undefined, updatedAt: new Date().toISOString() });
    await audit(approver.name, "Scheme Approver", "scheme_approved", s.name.en);
    changed();
  });

export const sendBackScheme = (id: string, approver: Official, comment: string) =>
  net(async () => {
    const s = await db.schemes.get(id);
    if (!s) return;
    await db.schemes.update(id, { status: "sent_back", reviewComment: comment, updatedAt: new Date().toISOString() });
    await audit(approver.name, "Scheme Approver", "scheme_sent_back", s.name.en, comment);
    changed();
  });

export const publishScheme = (id: string, manager: Official) =>
  net(async () => {
    const s = await db.schemes.get(id);
    if (!s) return;
    if (s.previous && id.startsWith("rev-")) {
      const liveId = s.previous.id;
      await db.schemes.put({ ...s, id: liveId, status: "published", previous: null, featured: s.previous.featured, updatedAt: new Date().toISOString() });
      await db.schemes.delete(id);
    } else {
      await db.schemes.update(id, { status: "published", updatedAt: new Date().toISOString() });
    }
    await audit(manager.name, "Portal Manager", "scheme_published", s.name.en);
    changed();
  });

export const setPaused = (id: string, paused: boolean, manager: Official) =>
  net(async () => {
    const s = await db.schemes.get(id);
    if (!s) return;
    await db.schemes.update(id, { status: paused ? "paused" : "published" });
    await audit(manager.name, "Portal Manager", paused ? "scheme_paused" : "scheme_resumed", s.name.en);
    changed();
  });

export const deleteSchemeDraft = (id: string) =>
  local(async () => {
    await db.schemes.delete(id);
    changed();
  });
