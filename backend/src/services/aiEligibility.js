/**
 * aiEligibility service
 *
 * Swappable interface for AI-driven pathway identification and checklist generation.
 * Current implementation: rule-based mock (AI_PROVIDER=mock). To wire a real LLM,
 * implement the same function contracts and switch on process.env.AI_PROVIDER.
 *
 * identifyPathway(description) -> Promise<{
 *   category: string,          // e.g. "Ayurveda"
 *   pathwayCode: string,       // one of: manufacturing | loan_licence | gmp | export | clinic
 *   confidence: number,        // 0-1
 *   reasoning: string          // plain-language explanation shown to the applicant
 * }>
 *
 * generateChecklist(pathwayCode) -> Promise<Array<{ label: string, required: boolean }>>
 */

const CHECKLISTS = {
  manufacturing: [
    { label: "Business registration certificate (GST/Udyam)", required: true },
    { label: "Site plan and layout of manufacturing unit", required: true },
    { label: "List of machinery and equipment", required: true },
    { label: "Details of qualified technical staff (pharmacist/expert)", required: true },
    { label: "Product formulation / master formula records", required: true },
    { label: "Water testing report for manufacturing premises", required: false },
  ],
  loan_licence: [
    { label: "Business registration certificate (GST/Udyam)", required: true },
    { label: "Agreement with the licensed manufacturing unit", required: true },
    { label: "Licensed manufacturer's manufacturing licence copy", required: true },
    { label: "Product formulation / master formula records", required: true },
    { label: "Labelling and packaging artwork", required: false },
  ],
  gmp: [
    { label: "Existing manufacturing licence copy", required: true },
    { label: "Quality management system documentation (SOPs)", required: true },
    { label: "Site master file", required: true },
    { label: "Self-inspection / internal audit report", required: true },
    { label: "Calibration records for equipment", required: false },
  ],
  export: [
    { label: "Manufacturing licence / GMP certificate copy", required: true },
    { label: "Free sale certificate", required: true },
    { label: "Product composition and specification sheet", required: true },
    { label: "Import regulations compliance declaration for destination country", required: false },
  ],
  clinic: [
    { label: "Practitioner registration / qualification certificate", required: true },
    { label: "Clinic premises ownership or lease proof", required: true },
    { label: "List of treatments/services offered", required: true },
    { label: "Biomedical waste management agreement", required: false },
  ],
};

const KEYWORD_RULES = [
  { pathwayCode: "clinic", category: "Ayurveda", keywords: ["clinic", "patient", "treatment", "consultation", "therapy", "wellness centre", "practitioner"] },
  { pathwayCode: "export", category: "Ayurveda", keywords: ["export", "overseas", "international sale", "foreign market"] },
  { pathwayCode: "gmp", category: "Ayurveda", keywords: ["gmp", "good manufacturing practice", "quality certification"] },
  { pathwayCode: "loan_licence", category: "Ayurveda", keywords: ["third party", "contract manufactur", "job work", "loan licence", "loan license"] },
  { pathwayCode: "manufacturing", category: "Ayurveda", keywords: ["manufactur", "produce", "tablet", "churna", "formulation", "factory"] },
];

function inferCategory(description) {
  const text = description.toLowerCase();
  if (text.includes("unani")) return "Unani";
  if (text.includes("siddha")) return "Siddha";
  if (text.includes("homoeopath") || text.includes("homeopath")) return "Homoeopathy";
  if (text.includes("yoga") || text.includes("naturopath")) return "Yoga & Naturopathy";
  return "Ayurveda";
}

async function identifyPathway(description) {
  const text = (description || "").toLowerCase();
  const category = inferCategory(text);

  let matched = null;
  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((kw) => text.includes(kw))) {
      matched = rule;
      break;
    }
  }

  const pathwayCode = matched ? matched.pathwayCode : "manufacturing";
  const confidence = matched ? 0.82 : 0.55;
  const reasoning = matched
    ? `Based on your description mentioning "${matched.keywords.find((kw) => text.includes(kw))}", this looks like a ${category} business best suited to the ${pathwayCode.replace("_", " ")} pathway.`
    : `We couldn't find a strong signal in your description, so we've defaulted to the manufacturing pathway as the most common starting point. You can change this if it doesn't match your business.`;

  return { category, pathwayCode, confidence, reasoning };
}

async function generateChecklist(pathwayCode) {
  return CHECKLISTS[pathwayCode] || CHECKLISTS.manufacturing;
}

module.exports = { identifyPathway, generateChecklist, CHECKLISTS };
