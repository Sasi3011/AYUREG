const db = require("../models");
const { ApiError } = require("../middleware/errorHandler");
const { logAudit, notify } = require("./applicationController");

async function queue(req, res, next) {
  try {
    const { status, pathwayCode } = req.query;
    const conditions = ["a.status IN ('manual_verification','correction_required')"];
    const params = [];

    if (status) {
      params.push(status);
      conditions.push(`a.status = $${params.length}`);
    }
    if (pathwayCode) {
      params.push(pathwayCode);
      conditions.push(`p.code = $${params.length}`);
    }

    const result = await db.query(
      `SELECT a.*, b.business_name, u.name AS applicant_name, p.name AS pathway_name, p.code AS pathway_code
       FROM applications a
       JOIN businesses b ON b.id = a.business_id
       JOIN users u ON u.id = b.user_id
       LEFT JOIN pathways p ON p.id = a.pathway_id
       WHERE ${conditions.join(" AND ")}
       ORDER BY a.submitted_at ASC NULLS LAST`,
      params
    );
    res.json({ applications: result.rows });
  } catch (err) {
    next(err);
  }
}

async function decide(req, res, next) {
  try {
    const { decision, reason } = req.body;
    if (!["approved", "rejected", "correction_requested"].includes(decision)) {
      throw new ApiError(400, "Invalid decision", "VALIDATION_ERROR");
    }
    if (!reason || reason.trim().length < 5) {
      throw new ApiError(400, "A reason is required for every decision", "VALIDATION_ERROR");
    }

    const appRes = await db.query(
      `SELECT a.*, b.user_id AS owner_id FROM applications a
       JOIN businesses b ON b.id = a.business_id WHERE a.id = $1`,
      [req.params.id]
    );
    const application = appRes.rows[0];
    if (!application) throw new ApiError(404, "Application not found", "NOT_FOUND");
    if (!["submitted", "ai_verification", "manual_verification"].includes(application.status)) {
      throw new ApiError(400, `Application is not awaiting a decision (status: ${application.status})`, "INVALID_STATE");
    }

    const statusMap = {
      approved: "approved",
      rejected: "rejected",
      correction_requested: "correction_required",
    };

    await db.query(
      `INSERT INTO officer_decisions (application_id, officer_id, decision, reason) VALUES ($1,$2,$3,$4)`,
      [application.id, req.user.id, decision, reason]
    );

    const updated = await db.query(
      `UPDATE applications SET status = $1, assigned_officer_id = $2, decided_at = now(), updated_at = now()
       WHERE id = $3 RETURNING *`,
      [statusMap[decision], req.user.id, application.id]
    );

    await logAudit(req.user.id, application.id, "officer_decision", { decision, reason });
    await notify(application.owner_id, application.id, `Your application status changed: ${statusMap[decision]}. Reason: ${reason}`);

    res.json({ application: updated.rows[0] });
  } catch (err) {
    next(err);
  }
}

// Decisions made by the current officer, newest first
async function history(req, res, next) {
  try {
    const result = await db.query(
      `SELECT d.id, d.application_id, d.decision, d.reason, d.decided_at,
              a.status, b.business_name, u.name AS applicant_name, p.name AS pathway_name
       FROM officer_decisions d
       JOIN applications a ON a.id = d.application_id
       JOIN businesses b ON b.id = a.business_id
       JOIN users u ON u.id = b.user_id
       LEFT JOIN pathways p ON p.id = a.pathway_id
       WHERE d.officer_id = $1
       ORDER BY d.decided_at DESC, d.id DESC`,
      [req.user.id]
    );
    res.json({ decisions: result.rows });
  } catch (err) {
    next(err);
  }
}

// Search non-draft applications by business name, applicant name/email or application id
async function search(req, res, next) {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return res.json({ applications: [] });
    const like = `%${q.toLowerCase()}%`;
    const result = await db.query(
      `SELECT a.*, b.business_name, u.name AS applicant_name, u.email AS applicant_email,
              p.name AS pathway_name, p.code AS pathway_code
       FROM applications a
       JOIN businesses b ON b.id = a.business_id
       JOIN users u ON u.id = b.user_id
       LEFT JOIN pathways p ON p.id = a.pathway_id
       WHERE a.status != 'draft'
         AND (LOWER(b.business_name) LIKE $1 OR LOWER(u.name) LIKE $2 OR LOWER(u.email) LIKE $3 OR CAST(a.id AS TEXT) = $4)
       ORDER BY a.updated_at DESC
       LIMIT 50`,
      [like, like, like, q.replace(/^#/, "")]
    );
    res.json({ applications: result.rows });
  } catch (err) {
    next(err);
  }
}

// Personal + pipeline metrics for the officer reports page
async function stats(req, res, next) {
  try {
    const mine = await db.query(
      `SELECT
         CAST(COUNT(*) AS INTEGER) AS total,
         CAST(SUM(CASE WHEN decision = 'approved' THEN 1 ELSE 0 END) AS INTEGER) AS approved,
         CAST(SUM(CASE WHEN decision = 'rejected' THEN 1 ELSE 0 END) AS INTEGER) AS rejected,
         CAST(SUM(CASE WHEN decision = 'correction_requested' THEN 1 ELSE 0 END) AS INTEGER) AS corrections
       FROM officer_decisions WHERE officer_id = $1`,
      [req.user.id]
    );
    const turnaround = await db.query(
      `SELECT CAST(AVG(julianday(d.decided_at) - julianday(a.submitted_at)) AS FLOAT) AS avg_days
       FROM officer_decisions d JOIN applications a ON a.id = d.application_id
       WHERE d.officer_id = $1 AND a.submitted_at IS NOT NULL`,
      [req.user.id]
    );
    const pending = await db.query(
      "SELECT CAST(COUNT(*) AS INTEGER) AS count FROM applications WHERE status = 'manual_verification'"
    );
    const byDay = await db.query(
      `SELECT date(decided_at) AS day, CAST(COUNT(*) AS INTEGER) AS count
       FROM officer_decisions WHERE officer_id = $1 AND decided_at >= date('now','-13 days')
       GROUP BY date(decided_at) ORDER BY day`,
      [req.user.id]
    );
    const byPathway = await db.query(
      `SELECT COALESCE(p.name,'Unassigned') AS pathway, CAST(COUNT(*) AS INTEGER) AS count
       FROM officer_decisions d
       JOIN applications a ON a.id = d.application_id
       LEFT JOIN pathways p ON p.id = a.pathway_id
       WHERE d.officer_id = $1 GROUP BY p.name ORDER BY count DESC`,
      [req.user.id]
    );
    const m = mine.rows[0] || {};
    res.json({
      total: m.total || 0,
      approved: m.approved || 0,
      rejected: m.rejected || 0,
      corrections: m.corrections || 0,
      avgTurnaroundDays: turnaround.rows[0]?.avg_days || 0,
      pendingQueue: pending.rows[0]?.count || 0,
      byDay: byDay.rows,
      byPathway: byPathway.rows,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { queue, decide, history, search, stats };
