export type Lang = "en" | "hi";
export type L10n = { en: string; hi: string };

export type Category =
  | "education" | "agriculture" | "pension" | "housing" | "health" | "women" | "skills" | "disability" | "livelihood";

export type RuleField = "age" | "income" | "gender" | "occupation" | "category" | "state";
export type RuleOp = "gte" | "lte" | "eq" | "in";
export interface Rule {
  id: string;
  field: RuleField;
  op: RuleOp;
  value: string | number | string[];
}

export type DocType =
  | "aadhaar" | "income" | "caste" | "bank" | "photo" | "land" | "marksheet" | "disability" | "age" | "residence" | "pregnancy" | "other";

export interface FormField {
  id: string;
  label: L10n;
  type: "text" | "number" | "select" | "yesno";
  options?: { value: string; label: L10n }[];
  required: boolean;
  hint?: L10n;
}

export type SchemeStatus = "draft" | "pending_approval" | "approved" | "published" | "paused" | "sent_back";

export interface Scheme {
  id: string;
  code: string;
  name: L10n;
  tagline: L10n;
  description: L10n;
  level: "central" | "state";
  state?: string;
  category: Category;
  department: L10n;
  benefits: L10n[];
  benefitAmount: number;
  benefitLabel: L10n;
  rules: Rule[];
  documents: DocType[];
  fields: FormField[];
  budget: { total: number; spent: number };
  opens: string;
  closes: string;
  faqs: { q: L10n; a: L10n }[];
  status: SchemeStatus;
  featured?: boolean;
  authorId?: string;
  updatedAt: string;
  reviewComment?: string;
  previous?: Omit<Scheme, "previous"> | null;
  beneficiaries: number;
}

export type Gender = "female" | "male" | "other";
export type Occupation = "student" | "farmer" | "unemployed" | "salaried" | "self_employed" | "labourer" | "homemaker" | "retired";
export type SocialCategory = "general" | "obc" | "sc" | "st" | "ews";

export interface Citizen {
  id: string;
  mobile: string;
  name: string;
  nameHi?: string;
  dob: string;
  gender: Gender;
  state: string;
  district: string;
  income: number;
  occupation: Occupation;
  category: SocialCategory;
  aadhaar: string;
  bankAccount: string;
  ifsc: string;
  demo?: boolean;
}

export type Role = "district_officer" | "scheme_author" | "scheme_approver" | "sanctioning_authority" | "portal_manager";
export interface Official {
  id: string;
  name: string;
  role: Role;
  designation: L10n;
  department: string;
  district?: string;
  active: boolean;
  email: string;
}

export type Stage = "submitted" | "auto_verified" | "district_verified" | "sanctioned" | "credited";
export const STAGES: Stage[] = ["submitted", "auto_verified", "district_verified", "sanctioned", "credited"];
export type AppStatus = "active" | "sent_back" | "rejected";

export interface TimelineEvent {
  id: string;
  kind: Stage | "sent_back" | "resubmitted" | "rejected" | "comment";
  at: string;
  by: string;
  role: string;
  comment?: string;
}

export interface FraudFlag {
  code: "shared_bank" | "duplicate_id" | "tampered_doc";
  detail: L10n;
  status: "open" | "cleared" | "held";
}

export interface AttachedDoc {
  type: DocType;
  docId?: string;
  name: string;
}

export interface Application {
  id: string;
  ref: string;
  schemeId: string;
  citizenId: string;
  applicantName: string;
  state: string;
  district: string;
  stage: Stage;
  status: AppStatus;
  submittedAt: string;
  updatedAt: string;
  dueAt: string;
  amount: number;
  answers: Record<string, string>;
  documents: AttachedDoc[];
  bankAccount: string;
  ifsc: string;
  aadhaar: string;
  timeline: TimelineEvent[];
  flags: FraudFlag[];
  autoChecks: { label: L10n; ok: boolean }[];
  batchId?: string;
  correctionNote?: string;
  rejectionReason?: string;
}

export interface WalletDoc {
  id: string;
  ownerId: string;
  type: DocType;
  name: string;
  mime: string;
  blob: Blob;
  size: number;
  addedAt: string;
  expiresAt?: string;
}

export interface Draft {
  id: string; // `${citizenId}:${schemeId}`
  citizenId: string;
  schemeId: string;
  step: number;
  data: Record<string, unknown>;
  updatedAt: string;
  resubmitOf?: string;
}

export interface QueuedSubmission {
  id: string;
  kind: "application" | "grievance";
  payload: unknown;
  createdAt: string;
  label: string;
}

export interface Notice {
  id: string;
  userId: string;
  title: L10n;
  body: L10n;
  at: string;
  read: boolean;
  link?: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  role: string;
  action: string;
  target: string;
  detail?: string;
}

export interface Grievance {
  id: string;
  ref: string;
  appId: string;
  citizenId: string;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "resolved";
  createdAt: string;
  updates: { at: string; by: string; text: string }[];
}

export interface Batch {
  id: string;
  ref: string;
  schemeId: string;
  appIds: string[];
  total: number;
  createdAt: string;
  createdBy: string;
  status: "created" | "released";
  releasedAt?: string;
}

export interface Department {
  id: string;
  name: L10n;
  head: string;
}
