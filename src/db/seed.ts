import { db, setMeta } from "./index";
import { seedSchemes } from "./seed-schemes";
import type {
  Application, AuditEntry, Batch, Citizen, Department, DocType, FraudFlag, Grievance, Notice, Official, Scheme, Stage, TimelineEvent, WalletDoc,
} from "@/lib/types";
import { DAY } from "@/lib/utils";
import { DOC_TYPES, STATES } from "@/lib/reference";

export const SEED_VERSION = 3;

// Deterministic PRNG so the demo data is stable across resets.
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const DEMO_CITIZENS: Citizen[] = [
  {
    id: "cit-priya", mobile: "9876500001", name: "Priya Sharma", nameHi: "प्रिया शर्मा", dob: "2007-03-14", gender: "female",
    state: "Maharashtra", district: "Pune", income: 180000, occupation: "student", category: "obc",
    aadhaar: "XXXX-XXXX-4821", bankAccount: "50100012874521", ifsc: "DEMO0001021", demo: true,
  },
  {
    id: "cit-ramesh", mobile: "9876500002", name: "Ramesh Yadav", nameHi: "रमेश यादव", dob: "1981-07-02", gender: "male",
    state: "Uttar Pradesh", district: "Varanasi", income: 120000, occupation: "farmer", category: "obc",
    aadhaar: "XXXX-XXXX-1937", bankAccount: "30211458796302", ifsc: "DEMO0004410", demo: true,
  },
  {
    id: "cit-kamala", mobile: "9876500003", name: "Kamala Devi", nameHi: "कमला देवी", dob: "1958-01-20", gender: "female",
    state: "Bihar", district: "Gaya", income: 60000, occupation: "homemaker", category: "sc",
    aadhaar: "XXXX-XXXX-6650", bankAccount: "12345098761234", ifsc: "DEMO0007788", demo: true,
  },
];

export const OFFICIALS: Official[] = [
  { id: "off-do", name: "Sunita Kulkarni", role: "district_officer", designation: { en: "District Verification Officer", hi: "ज़िला सत्यापन अधिकारी" }, department: "dep-sw", district: "All demo districts", active: true, email: "do.demo@example.gov" },
  { id: "off-author", name: "Arjun Mehta", role: "scheme_author", designation: { en: "Scheme Author", hi: "योजना लेखक" }, department: "dep-sw", active: true, email: "author.demo@example.gov" },
  { id: "off-approver", name: "Dr. Farah Siddiqui", role: "scheme_approver", designation: { en: "Joint Secretary (Schemes)", hi: "संयुक्त सचिव (योजनाएँ)" }, department: "dep-sw", active: true, email: "approver.demo@example.gov" },
  { id: "off-sanction", name: "Vikram Rao", role: "sanctioning_authority", designation: { en: "Sanctioning Authority", hi: "स्वीकृति प्राधिकारी" }, department: "dep-fin", active: true, email: "sanction.demo@example.gov" },
  { id: "off-pm", name: "Neha Iyer", role: "portal_manager", designation: { en: "Portal Manager", hi: "पोर्टल प्रबंधक" }, department: "dep-it", active: true, email: "pm.demo@example.gov" },
  { id: "off-do2", name: "Rakesh Tiwari", role: "district_officer", designation: { en: "District Verification Officer", hi: "ज़िला सत्यापन अधिकारी" }, department: "dep-sw", district: "Lucknow", active: true, email: "do2.demo@example.gov" },
  { id: "off-do3", name: "Anjali Das", role: "district_officer", designation: { en: "District Verification Officer", hi: "ज़िला सत्यापन अधिकारी" }, department: "dep-sw", district: "Patna", active: false, email: "do3.demo@example.gov" },
];

const DEPARTMENTS: Department[] = [
  { id: "dep-sw", name: { en: "Department of Social Welfare (demo)", hi: "समाज कल्याण विभाग (डेमो)" }, head: "Secretary, Social Welfare" },
  { id: "dep-fin", name: { en: "Department of Finance (demo)", hi: "वित्त विभाग (डेमो)" }, head: "Principal Secretary, Finance" },
  { id: "dep-it", name: { en: "Department of Digital Services (demo)", hi: "डिजिटल सेवा विभाग (डेमो)" }, head: "Director, Digital Services" },
];

const FIRST = ["Mohan", "Sita", "Arif", "Lakshmi", "Gurpreet", "Anita", "Rahul", "Fatima", "Suresh", "Meena", "Joseph", "Kavita", "Imran", "Pooja", "Ravi", "Shabnam", "Deepak", "Geeta", "Manoj", "Rekha", "Vijay", "Asha", "Sanjay", "Nirmala", "Karan", "Bhavna", "Ajay", "Usha", "Prakash", "Radha"];
const LAST = ["Lal", "Kumari", "Khan", "Nair", "Singh", "Verma", "Patil", "Sheikh", "Reddy", "Joshi", "Thomas", "Mishra", "Ansari", "Gupta", "Pillai", "Bano", "Chauhan", "Rawat", "Paswan", "Bose"];

type Spec = { who: string; scheme: string; stage: Stage; status?: "sent_back" | "rejected"; ago: number; fraud?: FraudFlag["code"] };

// 40 applications across every stage. "who" is a demo citizen id or "s<n>" for a synthetic applicant.
const SPECS: Spec[] = [
  // Demo citizens
  { who: "cit-priya", scheme: "sch-vidya", stage: "auto_verified", ago: 6 },
  { who: "cit-priya", scheme: "sch-kaushal", stage: "credited", ago: 70 },
  { who: "cit-ramesh", scheme: "sch-krishi", stage: "sanctioned", ago: 21 },
  { who: "cit-ramesh", scheme: "sch-yantra", stage: "auto_verified", status: "sent_back", ago: 9 },
  { who: "cit-kamala", scheme: "sch-vayo", stage: "district_verified", ago: 14 },
  { who: "cit-kamala", scheme: "sch-griha", stage: "submitted", ago: 0.02 },
  // Officer queue (auto_verified, active) incl. 3 fraud cases
  { who: "s1", scheme: "sch-krishi", stage: "auto_verified", ago: 13, fraud: "shared_bank" },
  { who: "s2", scheme: "sch-vayo", stage: "auto_verified", ago: 11, fraud: "duplicate_id" },
  { who: "s3", scheme: "sch-griha", stage: "auto_verified", ago: 8, fraud: "tampered_doc" },
  { who: "s4", scheme: "sch-vidya", stage: "auto_verified", ago: 14 },
  { who: "s5", scheme: "sch-janani", stage: "auto_verified", ago: 12 },
  { who: "s6", scheme: "sch-kaushal", stage: "auto_verified", ago: 10 },
  { who: "s7", scheme: "sch-samarth", stage: "auto_verified", ago: 7 },
  { who: "s8", scheme: "sch-arogya", stage: "auto_verified", ago: 5 },
  { who: "s9", scheme: "sch-udaan", stage: "auto_verified", ago: 4 },
  { who: "s10", scheme: "sch-shramik", stage: "auto_verified", ago: 3 },
  { who: "s11", scheme: "sch-krishi", stage: "auto_verified", ago: 2 },
  { who: "s12", scheme: "sch-vidya", stage: "auto_verified", ago: 1 },
  { who: "s13", scheme: "sch-sahara", stage: "auto_verified", ago: 0.5 },
  // Submitted, awaiting auto-verification
  { who: "s14", scheme: "sch-vidya", stage: "submitted", ago: 0.01 },
  { who: "s15", scheme: "sch-arogya", stage: "submitted", ago: 0.03 },
  // District verified, awaiting sanction
  { who: "s16", scheme: "sch-krishi", stage: "district_verified", ago: 18 },
  { who: "s17", scheme: "sch-krishi", stage: "district_verified", ago: 17 },
  { who: "s18", scheme: "sch-vidya", stage: "district_verified", ago: 16 },
  { who: "s19", scheme: "sch-vidya", stage: "district_verified", ago: 15 },
  { who: "s20", scheme: "sch-vayo", stage: "district_verified", ago: 15 },
  { who: "s21", scheme: "sch-janani", stage: "district_verified", ago: 12 },
  { who: "s22", scheme: "sch-kaushal", stage: "district_verified", ago: 11 },
  { who: "s23", scheme: "sch-samarth", stage: "district_verified", ago: 10 },
  // Sanctioned (in an unreleased batch)
  { who: "s24", scheme: "sch-krishi", stage: "sanctioned", ago: 22 },
  { who: "s25", scheme: "sch-vidya", stage: "sanctioned", ago: 24 },
  // Credited
  { who: "s26", scheme: "sch-krishi", stage: "credited", ago: 60 },
  { who: "s27", scheme: "sch-vayo", stage: "credited", ago: 55 },
  { who: "s28", scheme: "sch-vidya", stage: "credited", ago: 50 },
  { who: "s29", scheme: "sch-griha", stage: "credited", ago: 80 },
  { who: "s30", scheme: "sch-janani", stage: "credited", ago: 40 },
  // Sent back and rejected
  { who: "s4b", scheme: "sch-arogya", stage: "auto_verified", status: "sent_back", ago: 9 },
  { who: "s5b", scheme: "sch-griha", stage: "auto_verified", status: "rejected", ago: 25 },
  { who: "s6b", scheme: "sch-vayo", stage: "auto_verified", status: "rejected", ago: 30 },
  { who: "s7b", scheme: "sch-shramik", stage: "district_verified", ago: 9 },
];

const DOCS_BY_SCHEME = (s: Scheme) => s.documents;

function docSvg(title: string, sub: string, accent: string) {
  return new Blob(
    [
      `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400"><rect width="640" height="400" rx="20" fill="#fff"/><rect x="0" y="0" width="640" height="64" rx="20" fill="#1B2A4A"/><rect x="0" y="44" width="640" height="20" fill="#1B2A4A"/><rect x="0" y="64" width="640" height="4" fill="${accent}"/><text x="32" y="42" font-family="sans-serif" font-size="22" fill="#fff" font-weight="700">${title}</text><rect x="32" y="100" width="120" height="150" rx="10" fill="#E8ECF4"/><circle cx="92" cy="160" r="28" fill="#C3CCDD"/><rect x="62" y="196" width="60" height="40" rx="20" fill="#C3CCDD"/><g fill="#1B2A4A" font-family="sans-serif"><text x="180" y="124" font-size="18" font-weight="700">${sub}</text><text x="180" y="156" font-size="14" fill="#5B6578">Specimen document · demo only</text></g><g fill="#D5DBE6"><rect x="180" y="180" width="380" height="12" rx="6"/><rect x="180" y="204" width="320" height="12" rx="6"/><rect x="180" y="228" width="260" height="12" rx="6"/></g><text x="32" y="360" font-family="sans-serif" font-size="12" fill="#8892A6">civicXindo demo · not a real document</text></svg>`,
    ],
    { type: "image/svg+xml" },
  );
}

const iso = (msAgo: number) => new Date(Date.now() - msAgo).toISOString();

export async function seedDatabase() {
  const rand = mulberry32(20261124);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
  const schemes = seedSchemes();
  const schemeById = Object.fromEntries(schemes.map((s) => [s.id, s]));
  const citizens: Citizen[] = [...DEMO_CITIZENS];
  const synth: Record<string, Citizen> = {};

  const makeSynthetic = (key: string, scheme: Scheme): Citizen => {
    if (synth[key]) return synth[key];
    const st = scheme.state ? STATES.find((s) => s.name === scheme.state)! : pick(STATES);
    const female = ["sch-janani", "sch-udaan", "sch-sahara"].includes(scheme.id) || rand() > 0.5;
    const first = female ? pick(["Sita", "Lakshmi", "Anita", "Fatima", "Meena", "Kavita", "Pooja", "Shabnam", "Geeta", "Rekha", "Asha", "Nirmala", "Bhavna", "Usha", "Radha"]) : pick(FIRST.filter((_, i) => i % 2 === 0));
    const ageBy: Record<string, number> = { "sch-vidya": 19, "sch-udaan": 17, "sch-vayo": 66, "sch-sahara": 52, "sch-janani": 26, "sch-kaushal": 23 };
    const age = (ageBy[scheme.id] ?? 30 + Math.floor(rand() * 20)) + Math.floor(rand() * 3);
    const occBy: Record<string, Citizen["occupation"]> = { "sch-vidya": "student", "sch-udaan": "student", "sch-krishi": "farmer", "sch-yantra": "farmer", "sch-kaushal": "unemployed", "sch-shramik": "labourer", "sch-vayo": "retired" };
    const c: Citizen = {
      id: `cit-${key}`,
      mobile: `98000${String(10000 + Object.keys(synth).length * 37).slice(-5)}`,
      name: `${first} ${pick(LAST)}`,
      dob: new Date(Date.now() - age * 365.25 * DAY).toISOString().slice(0, 10),
      gender: female ? "female" : "male",
      state: st.name,
      district: pick(st.districts),
      income: 40000 + Math.floor(rand() * 18) * 10000,
      occupation: occBy[scheme.id] ?? pick(["labourer", "self_employed", "homemaker", "unemployed"] as const),
      category: pick(["general", "obc", "sc", "st", "ews"] as const),
      aadhaar: `XXXX-XXXX-${String(1000 + Math.floor(rand() * 8999))}`,
      bankAccount: String(10000000000000 + Math.floor(rand() * 89999999999999)),
      ifsc: `DEMO000${String(1000 + Math.floor(rand() * 8999))}`,
    };
    synth[key] = c;
    citizens.push(c);
    return c;
  };

  const DO = OFFICIALS[0], SA = OFFICIALS[3];
  const apps: Application[] = [];
  const audit: AuditEntry[] = [];
  let seq = 1041;

  for (const spec of SPECS) {
    const scheme = schemeById[spec.scheme];
    const c = spec.who.startsWith("cit-") ? citizens.find((x) => x.id === spec.who)! : makeSynthetic(spec.who, scheme);
    const submitted = Date.now() - spec.ago * DAY;
    const t: TimelineEvent[] = [];
    const ev = (kind: TimelineEvent["kind"], at: number, by: string, role: string, comment?: string) =>
      t.push({ id: `ev-${seq}-${t.length}`, kind, at: new Date(at).toISOString(), by, role, comment });

    ev("submitted", submitted, c.name, "Applicant");
    const stageIdx = ["submitted", "auto_verified", "district_verified", "sanctioned", "credited"].indexOf(spec.stage);
    if (stageIdx >= 1) ev("auto_verified", submitted + 3 * 60_000, "Auto-verification service", "System");
    const step = Math.max(spec.ago / 5, 0.2) * DAY;
    if (stageIdx >= 2) ev("district_verified", submitted + step * 2, DO.name, "District Officer", "Documents verified in person. Recommended.");
    if (stageIdx >= 3) ev("sanctioned", submitted + step * 3, SA.name, "Sanctioning Authority");
    if (stageIdx >= 4) ev("credited", submitted + step * 3.5, "Payment system (simulated)", "System");
    if (spec.status === "sent_back")
      ev("sent_back", submitted + step * 1.5, DO.name, "District Officer", spec.scheme === "sch-yantra" ? "The land record uploaded is not readable. Please upload a clear copy of the khatauni." : "Hospital estimate is missing the doctor's signature. Please upload a signed copy.");
    if (spec.status === "rejected")
      ev("rejected", submitted + step * 2, DO.name, "District Officer", "Family already owns a pucca house as per field verification.");

    const flags: FraudFlag[] = [];
    if (spec.fraud === "shared_bank") flags.push({ code: "shared_bank", status: "open", detail: { en: "Bank account is also used by another beneficiary (Sita Paswan, application CXI/2026/KSI/001067).", hi: "यह बैंक खाता एक अन्य लाभार्थी (सीता पासवान, आवेदन CXI/2026/KSI/001067) द्वारा भी उपयोग किया जा रहा है।" } });
    if (spec.fraud === "duplicate_id") flags.push({ code: "duplicate_id", status: "open", detail: { en: "Aadhaar number matches an existing pension beneficiary under a different name.", hi: "आधार संख्या एक अन्य नाम से मौजूदा पेंशन लाभार्थी से मेल खाती है।" } });
    if (spec.fraud === "tampered_doc") flags.push({ code: "tampered_doc", status: "open", detail: { en: "Income certificate shows signs of editing: font mismatch in the amount field and metadata changed after issue date.", hi: "आय प्रमाणपत्र में संपादन के संकेत: राशि वाले भाग में फ़ॉन्ट भिन्न है और जारी होने के बाद मेटाडेटा बदला गया।" } });

    const id = `app-${seq}`;
    const ref = `CXI/2026/${scheme.code}/00${seq}`;
    const app: Application = {
      id, ref, schemeId: scheme.id, citizenId: c.id, applicantName: c.name, state: c.state, district: c.district,
      stage: spec.stage, status: spec.status ?? "active",
      submittedAt: new Date(submitted).toISOString(), updatedAt: t[t.length - 1].at,
      dueAt: new Date(submitted + 15 * DAY).toISOString(),
      amount: scheme.benefitAmount,
      answers: Object.fromEntries(scheme.fields.map((f) => [f.id, f.type === "yesno" ? (f.id === "own_pucca" || f.id === "other_pension" ? "no" : "yes") : f.type === "number" ? String(f.id === "land" ? 2 : f.id === "marks" ? 72 : f.id === "percent" ? 60 : 450) : f.options ? f.options[0].value : f.id === "institution" ? "Government College (demo)" : "Provided"])),
      documents: DOCS_BY_SCHEME(scheme).map((d) => ({ type: d, name: `${DOC_TYPES[d].label.en}.pdf` })),
      bankAccount: spec.fraud === "shared_bank" ? "30211400991177" : c.bankAccount,
      ifsc: c.ifsc,
      aadhaar: c.aadhaar,
      timeline: t,
      flags,
      autoChecks: [
        { label: { en: "Aadhaar verified", hi: "आधार सत्यापित" }, ok: spec.fraud !== "duplicate_id" },
        { label: { en: "Bank account validated", hi: "बैंक खाता मान्य" }, ok: spec.fraud !== "shared_bank" },
        { label: { en: "Income within limit", hi: "आय सीमा के भीतर" }, ok: true },
        { label: { en: "No duplicate application", hi: "कोई दोहरा आवेदन नहीं" }, ok: spec.fraud !== "duplicate_id" },
        { label: { en: "Document authenticity", hi: "दस्तावेज़ प्रामाणिकता" }, ok: spec.fraud !== "tampered_doc" },
      ],
      correctionNote: spec.status === "sent_back" ? t[t.length - 1].comment : undefined,
      rejectionReason: spec.status === "rejected" ? t[t.length - 1].comment : undefined,
    };
    apps.push(app);
    for (const e of t) audit.push({ id: `au-${e.id}`, at: e.at, actor: e.by, role: e.role, action: e.kind, target: ref });
    seq++;
  }

  // Make the "shared bank" counterpart exist: a credited app with the same account.
  const sharedCounterpart = apps.find((a) => a.stage === "credited" && a.schemeId === "sch-krishi");
  if (sharedCounterpart) {
    sharedCounterpart.bankAccount = "30211400991177";
  }

  // Batches for sanctioned (created) and credited (released) apps.
  const batches: Batch[] = [];
  const groups = new Map<string, Application[]>();
  for (const a of apps.filter((a) => a.stage === "sanctioned" || a.stage === "credited")) {
    const k = `${a.schemeId}:${a.stage}`;
    groups.set(k, [...(groups.get(k) ?? []), a]);
  }
  let bseq = 201;
  for (const [k, list] of groups) {
    const [schemeId, stage] = k.split(":");
    const scheme = schemeById[schemeId];
    const id = `bat-${bseq}`;
    const createdAt = list[0].timeline.find((e) => e.kind === "sanctioned")?.at ?? iso(DAY);
    batches.push({
      id, ref: `CXI/SAN/2026/${scheme.code}/${bseq}`, schemeId, appIds: list.map((a) => a.id),
      total: list.reduce((s, a) => s + a.amount, 0), createdAt, createdBy: SA.name,
      status: stage === "credited" ? "released" : "created",
      releasedAt: stage === "credited" ? list[0].timeline.find((e) => e.kind === "credited")?.at : undefined,
    });
    list.forEach((a) => (a.batchId = id));
    bseq++;
  }

  // A scheme waiting for approval (with a previous version for the diff view) and a draft from the author.
  const pending: Scheme = {
    ...schemeById["sch-kaushal"],
    id: "sch-kaushal",
    status: "pending_approval",
    authorId: "off-author",
    benefitAmount: 10000,
    benefitLabel: { en: "₹10,000 stipend", hi: "₹10,000 वृत्ति" },
    benefits: [
      { en: "Free training in 50+ trades", hi: "50+ ट्रेडों में निःशुल्क प्रशिक्षण" },
      { en: "₹10,000 stipend on completion", hi: "पूरा होने पर ₹10,000 वृत्ति" },
      { en: "Placement assistance", hi: "रोज़गार सहायता" },
    ],
    closes: new Date(Date.now() + 60 * DAY).toISOString(),
    previous: { ...schemeById["sch-kaushal"] },
  };
  // Keep the published version live; the pending revision is stored as a separate record.
  const pendingRevision: Scheme = { ...pending, id: "rev-kaushal", featured: false };
  const newDraft: Scheme = {
    ...schemeById["sch-shramik"],
    id: "sch-matsya",
    code: "MSS",
    name: { en: "Matsya Sampada Fisher Support", hi: "मत्स्य संपदा मछुआरा सहायता" },
    tagline: { en: "Support for traditional fishers during the lean season", hi: "मंदी के मौसम में पारंपरिक मछुआरों के लिए सहायता" },
    description: { en: "Seasonal livelihood support and equipment assistance for registered traditional fishers.", hi: "पंजीकृत पारंपरिक मछुआरों के लिए मौसमी आजीविका एवं उपकरण सहायता।" },
    level: "central",
    state: undefined,
    category: "livelihood",
    status: "approved",
    authorId: "off-author",
    benefitAmount: 9000,
    benefitLabel: { en: "₹9,000 per season", hi: "₹9,000 प्रति मौसम" },
    benefits: [{ en: "₹3,000 per month for 3 lean months", hi: "मंदी के 3 महीनों के लिए ₹3,000 प्रति माह" }],
    rules: [{ id: "r1", field: "occupation", op: "in", value: ["self_employed", "labourer"] }, { id: "r2", field: "income", op: "lte", value: 200000 }],
    documents: ["aadhaar", "bank", "residence"],
    budget: { total: 50_00_00_000, spent: 0 },
    beneficiaries: 0,
    featured: false,
    previous: null,
  };

  const now = Date.now();
  const notifications: Notice[] = [
    { id: "n1", userId: "cit-priya", title: { en: "Application auto-verified", hi: "आवेदन स्वतः सत्यापित" }, body: { en: "Your Vidya Setu scholarship application has passed automatic checks and is with the district office.", hi: "आपका विद्या सेतु छात्रवृत्ति आवेदन स्वचालित जाँच में सफल रहा और ज़िला कार्यालय को भेजा गया है।" }, at: iso(6 * DAY - 300000), read: false, link: "/track" },
    { id: "n2", userId: "cit-priya", title: { en: "Amount credited", hi: "राशि जमा" }, body: { en: "₹8,000 under Kaushal Path has been credited to your bank account.", hi: "कौशल पथ के अंतर्गत ₹8,000 आपके बैंक खाते में जमा कर दिए गए हैं।" }, at: iso(40 * DAY), read: true, link: "/track" },
    { id: "n3", userId: "cit-ramesh", title: { en: "Correction needed", hi: "सुधार आवश्यक" }, body: { en: "Your Kisan Yantra Anudan application was sent back. Please upload a clear land record.", hi: "आपका किसान यंत्र अनुदान आवेदन वापस भेजा गया है। कृपया स्पष्ट भूमि अभिलेख अपलोड करें।" }, at: iso(7 * DAY), read: false, link: "/track" },
    { id: "n4", userId: "cit-ramesh", title: { en: "Application sanctioned", hi: "आवेदन स्वीकृत" }, body: { en: "Your Krishi Sahara application has been sanctioned. Payment will be released soon.", hi: "आपका कृषि सहारा आवेदन स्वीकृत हो गया है। भुगतान शीघ्र जारी होगा।" }, at: iso(8 * DAY), read: false, link: "/track" },
    { id: "n5", userId: "cit-kamala", title: { en: "District verification complete", hi: "ज़िला सत्यापन पूर्ण" }, body: { en: "Your Vayo Sneh pension application has been recommended by the district office.", hi: "आपके वयो स्नेह पेंशन आवेदन की ज़िला कार्यालय द्वारा अनुशंसा की गई है।" }, at: iso(5 * DAY), read: false, link: "/track" },
  ];

  const grievances: Grievance[] = [
    {
      id: "grv-1", ref: "GRV/2026/00311", appId: apps.find((a) => a.citizenId === "cit-kamala" && a.schemeId === "sch-vayo")!.id, citizenId: "cit-kamala",
      subject: "Delay in pension sanction", description: "My application was verified two weeks ago. When will the pension start?",
      status: "in_progress", createdAt: iso(3 * DAY),
      updates: [{ at: iso(2 * DAY), by: "Grievance cell", text: "Forwarded to the sanctioning authority for early action." }],
    },
  ];

  // Wallet documents for demo citizens.
  const wallet: WalletDoc[] = [];
  const addDoc = (ownerId: string, type: DocType, sub: string, ageDays: number, accent: string) => {
    const blob = docSvg(DOC_TYPES[type].label.en, sub, accent);
    const added = now - ageDays * DAY;
    const v = DOC_TYPES[type].validityDays;
    wallet.push({
      id: `doc-${ownerId}-${type}`, ownerId, type, name: `${DOC_TYPES[type].label.en}.svg`, mime: "image/svg+xml", blob, size: blob.size,
      addedAt: new Date(added).toISOString(), expiresAt: v ? new Date(added + v * DAY).toISOString() : undefined,
    });
  };
  addDoc("cit-priya", "aadhaar", "Priya Sharma", 400, "#FF9933");
  addDoc("cit-priya", "income", "Annual income ₹1,80,000", 345, "#138808");
  addDoc("cit-priya", "marksheet", "Class 12 · 81%", 150, "#2563EB");
  addDoc("cit-priya", "bank", "A/c ••••4521", 200, "#1B2A4A");
  addDoc("cit-ramesh", "aadhaar", "Ramesh Yadav", 900, "#FF9933");
  addDoc("cit-ramesh", "land", "Khasra 214/2 · 2.1 acres", 300, "#138808");
  addDoc("cit-ramesh", "bank", "A/c ••••6302", 500, "#1B2A4A");
  addDoc("cit-kamala", "aadhaar", "Kamala Devi", 1200, "#FF9933");
  addDoc("cit-kamala", "age", "Date of birth 20-01-1958", 1200, "#2563EB");
  addDoc("cit-kamala", "income", "Annual income ₹60,000", 380, "#138808");
  addDoc("cit-kamala", "bank", "A/c ••••1234", 700, "#1B2A4A");

  audit.push(
    ...schemes.map((s, i) => ({ id: `au-pub-${s.id}`, at: iso((90 + i * 7) * DAY), actor: "Neha Iyer", role: "Portal Manager", action: "scheme_published", target: s.name.en })),
    { id: "au-sub-rev", at: iso(2 * DAY), actor: "Arjun Mehta", role: "Scheme Author", action: "scheme_submitted", target: "Kaushal Path Skill Training Stipend (revision)" },
    { id: "au-app-new", at: iso(1 * DAY), actor: "Dr. Farah Siddiqui", role: "Scheme Approver", action: "scheme_approved", target: "Matsya Sampada Fisher Support" },
  );

  await db.transaction("rw", [db.schemes, db.citizens, db.officials, db.departments, db.applications, db.documents, db.notifications, db.audit, db.grievances, db.batches, db.meta], async () => {
    await Promise.all([
      db.schemes.bulkPut([...schemes, pendingRevision, newDraft]),
      db.citizens.bulkPut(citizens),
      db.officials.bulkPut(OFFICIALS),
      db.departments.bulkPut(DEPARTMENTS),
      db.applications.bulkPut(apps),
      db.documents.bulkPut(wallet),
      db.notifications.bulkPut(notifications),
      db.audit.bulkPut(audit),
      db.grievances.bulkPut(grievances),
      db.batches.bulkPut(batches),
    ]);
    await setMeta("seedVersion", SEED_VERSION);
    await setMeta("seededAt", new Date().toISOString());
  });
}

export async function resetDatabase() {
  await db.transaction("rw", db.tables, async () => {
    await Promise.all(db.tables.map((t) => t.clear()));
  });
  await seedDatabase();
}
