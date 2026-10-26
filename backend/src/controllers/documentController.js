const db = require("../models");
const { ApiError } = require("../middleware/errorHandler");
const documentVerification = require("../services/documentVerification");
const { logAudit } = require("./applicationController");

async function upload(req, res, next) {
  try {
    if (!req.file) throw new ApiError(400, "No file uploaded", "VALIDATION_ERROR");
    const { applicationId, checklistItemId } = req.body;
    if (!applicationId) throw new ApiError(400, "applicationId is required", "VALIDATION_ERROR");

    const appRes = await db.query(
      `SELECT a.*, b.user_id AS owner_id FROM applications a
       JOIN businesses b ON b.id = a.business_id WHERE a.id = $1`,
      [applicationId]
    );
    const application = appRes.rows[0];
    if (!application) throw new ApiError(404, "Application not found", "NOT_FOUND");
    if (application.owner_id !== req.user.id) throw new ApiError(403, "Not your application", "FORBIDDEN");
    if (!["draft", "correction_required"].includes(application.status)) {
      throw new ApiError(400, "Documents can only be changed while the application is a draft or awaiting correction", "INVALID_STATE");
    }

    let checklistLabel = "supporting document";
    if (checklistItemId) {
      const itemRes = await db.query("SELECT * FROM checklist_items WHERE id = $1", [checklistItemId]);
      if (itemRes.rows[0]) checklistLabel = itemRes.rows[0].label;
    }

    // Verify before writing anything so a failure can't leave a document without a verification row
    const verification = await documentVerification.preVerifyDocument({
      filePath: req.file.path,
      checklistLabel,
    });

    const docRes = await db.query(
      `INSERT INTO documents (application_id, checklist_item_id, file_path, original_name)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [applicationId, checklistItemId || null, req.file.filename, req.file.originalname]
    );
    const document = docRes.rows[0];

    // A re-upload replaces earlier files for the same checklist item (their verifications cascade)
    if (checklistItemId) {
      await db.query("DELETE FROM documents WHERE application_id = $1 AND checklist_item_id = $2 AND id != $3", [
        applicationId,
        checklistItemId,
        document.id,
      ]);
    }

    const verRes = await db.query(
      `INSERT INTO document_verifications (document_id, ocr_text, ai_status, ai_explanation, confidence_score)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [document.id, verification.ocrText, verification.aiStatus, verification.aiExplanation, verification.confidenceScore]
    );

    if (checklistItemId) {
      // Valid or not machine-checkable (null) → uploaded; any AI-detected problem → needs re-upload
      const newStatus = verification.aiStatus === "valid" || verification.aiStatus === null ? "uploaded" : "rejected";
      await db.query("UPDATE checklist_items SET status = $1, updated_at = now() WHERE id = $2", [
        newStatus,
        checklistItemId,
      ]);
    }

    await logAudit(req.user.id, applicationId, "document_uploaded", {
      documentId: document.id,
      aiStatus: verification.aiStatus,
    });

    res.status(201).json({ document, verification: verRes.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function getVerification(req, res, next) {
  try {
    const result = await db.query(
      "SELECT * FROM document_verifications WHERE document_id = $1 ORDER BY verified_at DESC LIMIT 1",
      [req.params.id]
    );
    if (!result.rows[0]) throw new ApiError(404, "No verification found", "NOT_FOUND");
    res.json({ verification: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = { upload, getVerification };
