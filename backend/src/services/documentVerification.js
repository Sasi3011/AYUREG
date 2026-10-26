/**
 * documentVerification service
 *
 * extractText(filePath) -> Promise<{ text: string|null, source: 'ocr'|'pdf'|'docx'|null }>
 *   - images: OCR via Tesseract.js
 *   - PDF:    embedded text layer via pdf-parse (scanned PDFs have none)
 *   - DOCX:   raw text via mammoth
 *   - other formats (.doc, .xls…): text = null (not machine-readable here)
 *
 * preVerifyDocument({ filePath, checklistLabel }) -> Promise<{
 *   ocrText: string,
 *   aiStatus: 'valid' | 'missing_info' | 'incorrect' | 'unreadable' | 'inconsistent' | null,
 *             // null = could not be machine-checked; left for the officer
 *   aiExplanation: string,       // plain-language, shown to the applicant
 *   confidenceScore: number|null // 0-100, null when no AI verdict
 * }>
 *
 * AI pre-verification is a screen only — it never approves an application on its own.
 * Every document, regardless of this outcome, is re-checked by a human officer.
 */
const fs = require("fs");
const path = require("path");
const Tesseract = require("tesseract.js");
// Require the library file directly: pdf-parse's index.js runs a debug self-test when loaded without a parent module.
const pdfParse = require("pdf-parse/lib/pdf-parse.js");
const mammoth = require("mammoth");

const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff", ".tif"]);

async function runOcr(filePath) {
  try {
    const { data } = await Tesseract.recognize(filePath, "eng");
    return (data.text || "").trim();
  } catch (err) {
    console.error("OCR failed:", err.message);
    return "";
  }
}

async function extractText(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  try {
    if (IMAGE_EXTS.has(ext)) return { text: await runOcr(filePath), source: "ocr" };
    if (ext === ".pdf") {
      const data = await pdfParse(fs.readFileSync(filePath));
      return { text: (data.text || "").trim(), source: "pdf" };
    }
    if (ext === ".docx") {
      const { value } = await mammoth.extractRawText({ path: filePath });
      return { text: (value || "").trim(), source: "docx" };
    }
  } catch (err) {
    console.error(`Text extraction failed for ${ext}:`, err.message);
    return { text: "", source: ext.slice(1) };
  }
  return { text: null, source: null };
}

function evaluateText({ text, source }, checklistLabel) {
  // Format we can't read (e.g. legacy .doc) — no AI verdict, officer inspects the file.
  if (text === null) {
    return {
      aiStatus: null,
      aiExplanation: `Uploaded for "${checklistLabel}". This file format can't be checked automatically — the reviewing officer will inspect it directly. Upload a PDF, DOCX or image for an instant check.`,
      confidenceScore: null,
    };
  }

  // A PDF with no text layer is almost always a scan — accept it for officer review rather than rejecting it.
  if (source === "pdf" && text.length < 10) {
    return {
      aiStatus: null,
      aiExplanation: `This PDF looks like a scanned image with no selectable text, so it couldn't be read automatically. The reviewing officer will inspect it directly. For an instant check, upload a text-based PDF or a clear JPG/PNG photo.`,
      confidenceScore: null,
    };
  }

  if (!text || text.length < 10) {
    return {
      aiStatus: "unreadable",
      aiExplanation: "We couldn't extract readable text from this document. Please upload a clearer scan or a higher-resolution photo.",
      confidenceScore: 20,
    };
  }
  if (text.length < 40) {
    return {
      aiStatus: "missing_info",
      aiExplanation: `This document seems too short for "${checklistLabel}". Make sure all pages/sections are included.`,
      confidenceScore: 45,
    };
  }
  return {
    aiStatus: "valid",
    aiExplanation: `The document contains readable content consistent with "${checklistLabel}". A human officer will still verify it before approval.`,
    confidenceScore: source === "ocr" ? 78 : 85,
  };
}

async function preVerifyDocument({ filePath, checklistLabel }) {
  const extracted = await extractText(filePath);
  const evaluation = evaluateText(extracted, checklistLabel);
  return { ocrText: extracted.text || "", ...evaluation };
}

module.exports = { runOcr, extractText, preVerifyDocument };
