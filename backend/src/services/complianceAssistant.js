/**
 * complianceAssistant service — multilingual Q&A about pathways/requirements.
 * answerQuestion({ question, pathwayCode, lang }) -> Promise<{ answer: string }>
 * Mock implementation: canned, pathway-aware responses in English/Hindi/Tamil.
 * Swap with a real LLM call later behind this same contract.
 */
const { CHECKLISTS } = require("./aiEligibility");

const TRANSLATIONS = {
  en: {
    intro: (pathway) => `For the ${pathway.replace("_", " ")} pathway, here's what you need to know:`,
    checklist: "Required documents include:",
    fallback:
      "I can help with eligibility, required documents, and rejection reasons for your selected pathway. Could you rephrase your question?",
    officer: "Remember: the AI never approves your application — a government officer always makes the final decision.",
  },
  hi: {
    intro: (pathway) => `${pathway.replace("_", " ")} मार्ग के लिए, यहाँ आपको जानने योग्य जानकारी है:`,
    checklist: "आवश्यक दस्तावेज़ों में शामिल हैं:",
    fallback: "मैं पात्रता, आवश्यक दस्तावेज़ों और अस्वीकृति के कारणों में मदद कर सकता हूँ। कृपया अपना प्रश्न दोबारा पूछें।",
    officer: "याद रखें: AI कभी आपका आवेदन स्वीकृत नहीं करता — अंतिम निर्णय हमेशा एक सरकारी अधिकारी लेता है।",
  },
  ta: {
    intro: (pathway) => `${pathway.replace("_", " ")} பாதைக்கு, நீங்கள் அறிய வேண்டியவை:`,
    checklist: "தேவையான ஆவணங்கள்:",
    fallback: "தகுதி, தேவையான ஆவணங்கள் மற்றும் நிராகரிப்பு காரணங்கள் குறித்து உதவ முடியும். தயவுசெய்து கேள்வியை மீண்டும் கேளுங்கள்.",
    officer: "நினைவில் கொள்ளுங்கள்: AI ஒருபோதும் உங்கள் விண்ணப்பத்தை அங்கீகரிக்காது — இறுதி முடிவை எப்போதும் அரசு அதிகாரி எடுப்பார்.",
  },
};

async function answerQuestion({ question, pathwayCode = "manufacturing", lang = "en" }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const q = (question || "").toLowerCase();

  if (q.includes("document") || q.includes("checklist") || q.includes("दस्तावेज़") || q.includes("ஆவண")) {
    const items = CHECKLISTS[pathwayCode] || CHECKLISTS.manufacturing;
    const list = items.map((i) => `- ${i.label}${i.required ? "" : " (optional)"}`).join("\n");
    return { answer: `${t.intro(pathwayCode)}\n${t.checklist}\n${list}\n\n${t.officer}` };
  }

  if (q.includes("reject") || q.includes("अस्वीकृत") || q.includes("நிராகரி")) {
    return {
      answer: `Applications are usually rejected due to incomplete or unreadable documents, mismatched business details, or missing mandatory items on your checklist. Check the AI pre-verification notes on each document for specifics. ${t.officer}`,
    };
  }

  return { answer: `${t.fallback}\n\n${t.officer}` };
}

module.exports = { answerQuestion };
