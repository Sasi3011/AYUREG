const db = require("../models");
const { ApiError } = require("../middleware/errorHandler");
const aiEligibility = require("../services/aiEligibility");

async function logAudit(userId, applicationId, action, details = {}) {
  const detailsStr = typeof details === "object" ? JSON.stringify(details) : String(details);
  await db.query(
    "INSERT INTO audit_logs (user_id, application_id, action, details) VALUES ($1,$2,$3,$4)",
    [userId || null, applicationId || null, action || "unknown", detailsStr]
  );
}

async function notify(userId, applicationId, message) {
  await db.query(
    "INSERT INTO notifications (user_id, application_id, message, channel) VALUES ($1,$2,$3,'in_app')",
    [userId || null, applicationId || null, message || ""]
  );
}

async function create(req, res, next) {
  try {
    const { businessName, description, pathwayCode, category } = req.body;
    if (!businessName || !description || !pathwayCode) {
      throw new ApiError(400, "businessName, description and pathwayCode are required", "VALIDATION_ERROR");
    }

    const bizRes = await db.query(
      `INSERT INTO businesses (user_id, business_name, description, category)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.user.id, businessName, description, category || null]
    );
    const business = bizRes.rows[0];

    const pathwayRes = await db.query("SELECT * FROM pathways WHERE code = $1", [pathwayCode]);
    const pathway = pathwayRes.rows[0];
    if (!pathway) throw new ApiError(400, "Unknown pathway", "VALIDATION_ERROR");

    const appRes = await db.query(
      `INSERT INTO applications (business_id, pathway_id, status) VALUES ($1,$2,'draft') RETURNING *`,
      [business.id, pathway.id]
    );
    const application = appRes.rows[0];

    const checklist = await aiEligibility.generateChecklist(pathway.code);
    for (const item of checklist) {
      await db.query(
        `INSERT INTO checklist_items (application_id, label, required, status) VALUES ($1,$2,$3,'pending')`,
        [application.id || null, item.label || "Supporting Document", item.required ? 1 : 0]
      );
    }

    await logAudit(req.user.id, application.id, "application_created", { pathwayCode });

    res.status(201).json({ application, business, pathway });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const appRes = await db.query(
      `SELECT a.*, b.business_name, b.description AS business_description, b.category, b.user_id AS owner_id,
              p.name AS pathway_name, p.code AS pathway_code
       FROM applications a
       JOIN businesses b ON b.id = a.business_id
       LEFT JOIN pathways p ON p.id = a.pathway_id
       WHERE a.id = $1`,
      [req.params.id]
    );
    const application = appRes.rows[0];
    if (!application) throw new ApiError(404, "Application not found", "NOT_FOUND");

    if (req.user.role === "applicant" && application.owner_id !== req.user.id) {
      throw new ApiError(403, "You cannot view this application", "FORBIDDEN");
    }

    const checklistRes = await db.query(
      "SELECT * FROM checklist_items WHERE application_id = $1 ORDER BY id", [application.id]
    );
    const documentsRes = await db.query(
      `SELECT d.*, v.ai_status, v.ai_explanation, v.confidence_score
       FROM documents d
       LEFT JOIN document_verifications v ON v.document_id = d.id
       WHERE d.application_id = $1 ORDER BY d.id`,
      [application.id]
    );
    const decisionsRes = await db.query(
      "SELECT * FROM officer_decisions WHERE application_id = $1 ORDER BY decided_at DESC",
      [application.id]
    );

    res.json({
      application,
      checklist: checklistRes.rows,
      documents: documentsRes.rows,
      decisions: decisionsRes.rows,
    });
  } catch (err) {
    next(err);
  }
}

async function listMine(req, res, next) {
  try {
    const result = await db.query(
      `SELECT a.*, b.business_name, p.name AS pathway_name, p.code AS pathway_code
       FROM applications a
       JOIN businesses b ON b.id = a.business_id
       LEFT JOIN pathways p ON p.id = a.pathway_id
       WHERE b.user_id = $1
       ORDER BY a.created_at DESC`,
      [req.user.id]
    );
    res.json({ applications: result.rows });
  } catch (err) {
    next(err);
  }
}

async function submit(req, res, next) {
  try {
    const appRes = await db.query(
      `SELECT a.*, b.user_id AS owner_id FROM applications a
       JOIN businesses b ON b.id = a.business_id WHERE a.id = $1`,
      [req.params.id]
    );
    const application = appRes.rows[0];
    if (!application) throw new ApiError(404, "Application not found", "NOT_FOUND");
    if (application.owner_id !== req.user.id) throw new ApiError(403, "Not your application", "FORBIDDEN");

    const checklistRes = await db.query(
      "SELECT * FROM checklist_items WHERE application_id = $1 AND required = true",
      [application.id]
    );
    const notReady = checklistRes.rows.filter((c) => c.status !== "verified" && c.status !== "uploaded");
    if (notReady.length > 0) {
      throw new ApiError(
        400,
        `All required checklist items must have a document uploaded before submitting (${notReady.length} pending).`,
        "CHECKLIST_INCOMPLETE"
      );
    }

    const updated = await db.query(
      `UPDATE applications SET status = 'ai_verification', submitted_at = now(), updated_at = now()
       WHERE id = $1 RETURNING *`,
      [application.id]
    );

    await logAudit(req.user.id, application.id, "application_submitted", {});
    await notify(req.user.id, application.id, "Your application has been submitted and is undergoing AI pre-verification.");

    // Move straight to manual_verification queue — AI screening happens per-document at upload time,
    // but a human officer always makes the final call.
    const finalStatus = await db.query(
      `UPDATE applications SET status = 'manual_verification', updated_at = now() WHERE id = $1 RETURNING *`,
      [application.id]
    );

    res.json({ application: finalStatus.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function resubmit(req, res, next) {
  try {
    const appRes = await db.query(
      `SELECT a.*, b.user_id AS owner_id FROM applications a
       JOIN businesses b ON b.id = a.business_id WHERE a.id = $1`,
      [req.params.id]
    );
    const application = appRes.rows[0];
    if (!application) throw new ApiError(404, "Application not found", "NOT_FOUND");
    if (application.owner_id !== req.user.id) throw new ApiError(403, "Not your application", "FORBIDDEN");
    if (application.status !== "correction_required") {
      throw new ApiError(400, "Only applications awaiting correction can be resubmitted", "INVALID_STATE");
    }

    const updated = await db.query(
      `UPDATE applications SET status = 'manual_verification', updated_at = datetime('now') WHERE id = $1 RETURNING *`,
      [application.id]
    );

    await logAudit(req.user.id, application.id, "application_resubmitted", {});
    await notify(req.user.id, application.id, "Your corrected application has been resubmitted for officer review.");

    res.json({ application: updated.rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, getById, listMine, submit, resubmit, logAudit, notify };
