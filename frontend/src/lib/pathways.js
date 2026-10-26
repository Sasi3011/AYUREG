import { Factory, FlaskConical, Globe2, HeartPulse, Handshake } from "lucide-react";

// Presentation details for each pathway code. Names and ids come from GET /api/pathway;
// fees mirror FEE_BY_PATHWAY in backend/src/controllers/paymentController.js.
export const PATHWAY_INFO = {
  manufacturing: {
    icon: Factory,
    tone: "indigo",
    fee: 5000,
    form: "Form 24-D",
    summary: "For businesses running their own factory that makes classical or proprietary AYUSH medicines.",
  },
  loan_licence: {
    icon: Handshake,
    tone: "teal",
    fee: 4000,
    form: "Form 25-E",
    summary: "Make your own formulations using spare capacity at an existing GMP-licensed plant.",
  },
  gmp: {
    icon: FlaskConical,
    tone: "violet",
    fee: 8000,
    form: "Schedule T",
    summary: "Good Manufacturing Practice certification covering facilities, hygiene, testing and SOPs.",
  },
  export: {
    icon: Globe2,
    tone: "amber",
    fee: 6000,
    form: "CoPP",
    summary: "Certificate of Pharmaceutical Product for exporting AYUSH products to international markets.",
  },
  clinic: {
    icon: HeartPulse,
    tone: "rose",
    fee: 2000,
    form: "Clinical Establishment",
    summary: "Registration for Panchakarma centres, wellness clinics, yoga and naturopathy facilities.",
  },
};

export function pathwayInfo(code) {
  return PATHWAY_INFO[code] || { icon: Factory, tone: "slate", fee: 5000, form: "—", summary: "" };
}
