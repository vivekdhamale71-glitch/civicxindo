import type { Category, DocType, L10n, Occupation, Role, SocialCategory, Gender, Stage } from "./types";

const l = (en: string, hi: string): L10n => ({ en, hi });

export const STATES: { name: string; hi: string; districts: string[] }[] = [
  { name: "Andhra Pradesh", hi: "आंध्र प्रदेश", districts: ["Guntur", "Visakhapatnam", "Kurnool"] },
  { name: "Assam", hi: "असम", districts: ["Kamrup", "Dibrugarh", "Jorhat"] },
  { name: "Bihar", hi: "बिहार", districts: ["Patna", "Gaya", "Muzaffarpur", "Darbhanga"] },
  { name: "Chhattisgarh", hi: "छत्तीसगढ़", districts: ["Raipur", "Bilaspur"] },
  { name: "Delhi", hi: "दिल्ली", districts: ["New Delhi", "South Delhi", "North Delhi"] },
  { name: "Gujarat", hi: "गुजरात", districts: ["Ahmedabad", "Surat", "Vadodara"] },
  { name: "Haryana", hi: "हरियाणा", districts: ["Gurugram", "Hisar", "Karnal"] },
  { name: "Jharkhand", hi: "झारखंड", districts: ["Ranchi", "Dhanbad"] },
  { name: "Karnataka", hi: "कर्नाटक", districts: ["Bengaluru Urban", "Mysuru", "Belagavi"] },
  { name: "Kerala", hi: "केरल", districts: ["Thiruvananthapuram", "Ernakulam", "Kozhikode"] },
  { name: "Madhya Pradesh", hi: "मध्य प्रदेश", districts: ["Bhopal", "Indore", "Jabalpur"] },
  { name: "Maharashtra", hi: "महाराष्ट्र", districts: ["Pune", "Nagpur", "Nashik", "Aurangabad"] },
  { name: "Odisha", hi: "ओडिशा", districts: ["Khordha", "Cuttack", "Ganjam"] },
  { name: "Punjab", hi: "पंजाब", districts: ["Ludhiana", "Amritsar"] },
  { name: "Rajasthan", hi: "राजस्थान", districts: ["Jaipur", "Jodhpur", "Udaipur"] },
  { name: "Tamil Nadu", hi: "तमिलनाडु", districts: ["Chennai", "Madurai", "Coimbatore"] },
  { name: "Telangana", hi: "तेलंगाना", districts: ["Hyderabad", "Warangal"] },
  { name: "Uttar Pradesh", hi: "उत्तर प्रदेश", districts: ["Lucknow", "Varanasi", "Gorakhpur", "Agra"] },
  { name: "Uttarakhand", hi: "उत्तराखंड", districts: ["Dehradun", "Nainital"] },
  { name: "West Bengal", hi: "पश्चिम बंगाल", districts: ["Kolkata", "Howrah", "Darjeeling"] },
];

export const stateLabel = (name: string, lang: "en" | "hi") => (lang === "hi" ? STATES.find((s) => s.name === name)?.hi ?? name : name);

export const DOC_TYPES: Record<DocType, { label: L10n; validityDays?: number; keywords: string[] }> = {
  aadhaar: { label: l("Aadhaar card", "आधार कार्ड"), keywords: ["aadhaar", "aadhar", "uid"] },
  income: { label: l("Income certificate", "आय प्रमाणपत्र"), validityDays: 365, keywords: ["income", "aay"] },
  caste: { label: l("Caste certificate", "जाति प्रमाणपत्र"), keywords: ["caste", "jati"] },
  bank: { label: l("Bank passbook", "बैंक पासबुक"), keywords: ["bank", "passbook", "cheque"] },
  photo: { label: l("Passport photo", "पासपोर्ट फ़ोटो"), keywords: ["photo", "selfie", "img", "image"] },
  land: { label: l("Land record", "भूमि अभिलेख"), keywords: ["land", "khasra", "khatauni", "7-12"] },
  marksheet: { label: l("Marksheet", "अंकपत्र"), keywords: ["mark", "result", "grade"] },
  disability: { label: l("Disability certificate", "दिव्यांगता प्रमाणपत्र"), validityDays: 1825, keywords: ["disab", "udid"] },
  age: { label: l("Age proof", "आयु प्रमाण"), keywords: ["birth", "age", "dob"] },
  residence: { label: l("Residence certificate", "निवास प्रमाणपत्र"), validityDays: 730, keywords: ["resid", "domicile", "address"] },
  pregnancy: { label: l("Mother and child card", "मातृ एवं शिशु कार्ड"), keywords: ["mcp", "pregnan", "anc"] },
  other: { label: l("Other document", "अन्य दस्तावेज़"), keywords: [] },
};

export const OCCUPATIONS: Record<Occupation, L10n> = {
  student: l("Student", "छात्र/छात्रा"),
  farmer: l("Farmer", "किसान"),
  unemployed: l("Seeking work", "रोज़गार की तलाश"),
  salaried: l("Salaried", "वेतनभोगी"),
  self_employed: l("Self-employed", "स्वरोज़गार"),
  labourer: l("Labourer", "श्रमिक"),
  homemaker: l("Homemaker", "गृहिणी"),
  retired: l("Retired", "सेवानिवृत्त"),
};

export const SOCIAL_CATEGORIES: Record<SocialCategory, L10n> = {
  general: l("General", "सामान्य"),
  obc: l("OBC", "अन्य पिछड़ा वर्ग"),
  sc: l("SC", "अनुसूचित जाति"),
  st: l("ST", "अनुसूचित जनजाति"),
  ews: l("EWS", "आर्थिक रूप से कमज़ोर वर्ग"),
};

export const GENDERS: Record<Gender, L10n> = {
  female: l("Female", "महिला"),
  male: l("Male", "पुरुष"),
  other: l("Other", "अन्य"),
};

export const CATEGORIES: Record<Category, L10n> = {
  education: l("Education", "शिक्षा"),
  agriculture: l("Agriculture", "कृषि"),
  pension: l("Pension", "पेंशन"),
  housing: l("Housing", "आवास"),
  health: l("Health", "स्वास्थ्य"),
  women: l("Women and child", "महिला एवं बाल"),
  skills: l("Skills and jobs", "कौशल एवं रोज़गार"),
  disability: l("Disability", "दिव्यांगता"),
  livelihood: l("Livelihood", "आजीविका"),
};

export const ROLES: Record<Role, { label: L10n; home: string }> = {
  district_officer: { label: l("District Officer", "ज़िला अधिकारी"), home: "/gov/queue" },
  scheme_author: { label: l("Scheme Author", "योजना लेखक"), home: "/gov/schemes" },
  scheme_approver: { label: l("Scheme Approver", "योजना अनुमोदक"), home: "/gov/approvals" },
  sanctioning_authority: { label: l("Sanctioning Authority", "स्वीकृति प्राधिकारी"), home: "/gov/sanction" },
  portal_manager: { label: l("Portal Manager", "पोर्टल प्रबंधक"), home: "/gov/command" },
};

export const STAGE_LABELS: Record<Stage, L10n> = {
  submitted: l("Submitted", "जमा किया गया"),
  auto_verified: l("Auto-verified", "स्वतः सत्यापित"),
  district_verified: l("District verification", "ज़िला सत्यापन"),
  sanctioned: l("Sanctioned", "स्वीकृत"),
  credited: l("Amount credited", "राशि जमा"),
};

export const RULE_FIELDS: Record<string, L10n> = {
  age: l("Age", "आयु"),
  income: l("Annual family income", "वार्षिक पारिवारिक आय"),
  gender: l("Gender", "लिंग"),
  occupation: l("Occupation", "व्यवसाय"),
  category: l("Social category", "सामाजिक वर्ग"),
  state: l("State", "राज्य"),
};

export const RULE_OPS: Record<string, L10n> = {
  gte: l("at least", "कम से कम"),
  lte: l("at most", "अधिकतम"),
  eq: l("is", "है"),
  in: l("is one of", "इनमें से एक"),
};
