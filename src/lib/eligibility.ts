import type { Citizen, Gender, L10n, Occupation, Rule, Scheme, SocialCategory } from "./types";
import { GENDERS, OCCUPATIONS, SOCIAL_CATEGORIES, stateLabel } from "./reference";
import { groupIN } from "./utils";

export interface Profile {
  state: string;
  age: number;
  gender: Gender;
  income: number;
  occupation: Occupation;
  category: SocialCategory;
}

export interface Reason {
  ok: boolean;
  label: L10n;
}

export function ageFromDob(dob: string) {
  const d = new Date(dob);
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) a--;
  return a;
}

export const profileFromCitizen = (c: Citizen): Profile => ({
  state: c.state,
  age: ageFromDob(c.dob),
  gender: c.gender,
  income: c.income,
  occupation: c.occupation,
  category: c.category,
});

const lakh = (n: number) => (n >= 100000 ? `₹${(n / 100000).toString().replace(/\.0$/, "")} lakh` : `₹${groupIN(n)}`);
const lakhHi = (n: number) => (n >= 100000 ? `₹${(n / 100000).toString().replace(/\.0$/, "")} लाख` : `₹${groupIN(n)}`);

function labelFor(rule: Rule, p: Profile): L10n {
  const v = rule.value;
  switch (rule.field) {
    case "age":
      return { en: `Age ${p.age}`, hi: `आयु ${p.age}` };
    case "income":
      return rule.op === "lte"
        ? { en: `Income below ${lakh(Number(v))}`, hi: `आय ${lakhHi(Number(v))} से कम` }
        : { en: `Income at least ${lakh(Number(v))}`, hi: `आय कम से कम ${lakhHi(Number(v))}` };
    case "gender":
      return GENDERS[p.gender];
    case "occupation":
      return OCCUPATIONS[p.occupation];
    case "category":
      return SOCIAL_CATEGORIES[p.category];
    case "state":
      return { en: `Resident of ${p.state}`, hi: `${stateLabel(p.state, "hi")} के निवासी` };
  }
}

export function evalRule(rule: Rule, p: Profile): boolean {
  const actual = p[rule.field];
  const v = rule.value;
  switch (rule.op) {
    case "gte":
      return Number(actual) >= Number(v);
    case "lte":
      return Number(actual) <= Number(v);
    case "eq":
      return String(actual) === String(v);
    case "in":
      return (Array.isArray(v) ? v : String(v).split(",")).map(String).includes(String(actual));
  }
}

export function evaluate(scheme: Scheme, p: Profile) {
  // Merge age gte/lte into one reason so "Age 19 ✓" appears once.
  const reasons: Reason[] = [];
  const seen = new Set<string>();
  let eligible = true;
  for (const rule of scheme.rules) {
    const ok = evalRule(rule, p);
    if (!ok) eligible = false;
    const key = rule.field === "age" ? "age" : rule.id;
    if (seen.has(key)) {
      if (!ok) reasons.find((r) => r.label.en.startsWith("Age"))!.ok = false;
      continue;
    }
    seen.add(key);
    reasons.push({ ok, label: labelFor(rule, p) });
  }
  return { eligible, reasons };
}

export function describeRule(rule: Rule, lang: "en" | "hi"): string {
  const v = rule.value;
  const val = (x: string | number) => {
    if (rule.field === "income") return lang === "hi" ? lakhHi(Number(x)) : lakh(Number(x));
    if (rule.field === "occupation") return OCCUPATIONS[x as Occupation]?.[lang] ?? String(x);
    if (rule.field === "gender") return GENDERS[x as Gender]?.[lang] ?? String(x);
    if (rule.field === "category") return SOCIAL_CATEGORIES[x as SocialCategory]?.[lang] ?? String(x);
    if (rule.field === "state") return stateLabel(String(x), lang);
    return String(x);
  };
  const values = Array.isArray(v) ? v.map(val).join(lang === "hi" ? " / " : " or ") : val(v);
  const en: Record<string, string> = {
    "age:gte": `Age ${values} years or above`,
    "age:lte": `Age up to ${values} years`,
    "income:lte": `Annual family income up to ${values}`,
    "income:gte": `Annual family income at least ${values}`,
  };
  const hi: Record<string, string> = {
    "age:gte": `आयु ${values} वर्ष या अधिक`,
    "age:lte": `आयु ${values} वर्ष तक`,
    "income:lte": `वार्षिक पारिवारिक आय ${values} तक`,
    "income:gte": `वार्षिक पारिवारिक आय कम से कम ${values}`,
  };
  const key = `${rule.field}:${rule.op}`;
  if (lang === "en" && en[key]) return en[key];
  if (lang === "hi" && hi[key]) return hi[key];
  const fieldName = { age: ["Age", "आयु"], income: ["Income", "आय"], gender: ["Gender", "लिंग"], occupation: ["Occupation", "व्यवसाय"], category: ["Category", "वर्ग"], state: ["State", "राज्य"] }[rule.field];
  return lang === "hi" ? `${fieldName[1]}: ${values}` : `${fieldName[0]}: ${values}`;
}
