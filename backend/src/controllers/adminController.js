const bcrypt = require("bcryptjs");
const db = require("../models");
const { ApiError } = require("../middleware/errorHandler");
const { logAudit } = require("./applicationController");

async function listUsers(req, res, next) {
  try {
    const result = await db.query(
      "SELECT id, name, email, phone, role, created_at FROM users ORDER BY created_at DESC"
    );
    res.json({ users: result.rows });
  } catch (err) {
    next(err);
  }
}

async function createUser(req, res, next) {
  try {
    const { name, email, phone, password, role } = req.body;
    if (!name || !email || !password || password.length < 8) {
      throw new ApiError(400, "Name, email and a password of at least 8 characters are required", "VALIDATION_ERROR");
    }
    if (!["applicant", "officer", "admin"].includes(role)) {
      throw new ApiError(400, "Invalid role", "VALIDATION_ERROR");
    }
    const hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (name, email, phone, password_hash, role) VALUES ($1,$2,$3,$4,$5)
       RETURNING id, name, email, phone, role, created_at`,
      [name, email, phone || null, hash, role]
    );
    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    if (err.code === "23505" || err.code === "SQLITE_CONSTRAINT_UNIQUE") return next(new ApiError(409, "Email already exists", "EMAIL_TAKEN"));
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const { name, phone, role } = req.body;
    const result = await db.query(
      `UPDATE users SET name = COALESCE($1,name), phone = COALESCE($2,phone), role = COALESCE($3,role), updated_at = now()
       WHERE id = $4 RETURNING id, name, email, phone, role, created_at`,
      [name || null, phone || null, role || null, req.params.id]
    );
    if (!result.rows[0]) throw new ApiError(404, "User not found", "NOT_FOUND");
    res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    if (Number(req.params.id) === req.user.id) {
      throw new ApiError(400, "You cannot delete your own account", "VALIDATION_ERROR");
    }
    await db.query("DELETE FROM users WHERE id = $1", [req.params.id]);
    res.status(204).send();
  } catch (err) {
    if (err.code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
      return next(new ApiError(409, "This user has review or audit history and cannot be deleted", "USER_IN_USE"));
    }
    next(err);
  }
}

async function analytics(req, res, next) {
  try {
    const byStatus = await db.query(
      "SELECT status, CAST(COUNT(*) AS INTEGER) AS count FROM applications GROUP BY status"
    );
    const byPathway = await db.query(
      `SELECT p.name AS pathway, CAST(COUNT(a.id) AS INTEGER) AS count
       FROM pathways p LEFT JOIN applications a ON a.pathway_id = p.id
       GROUP BY p.name ORDER BY p.name`
    );
    const approvalRate = await db.query(
      `SELECT
         CAST(SUM(CASE WHEN status IN ('approved','certificate_generated') THEN 1 ELSE 0 END) AS INTEGER) AS approved,
         CAST(SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS INTEGER) AS rejected,
         CAST(COUNT(*) AS INTEGER) AS total
       FROM applications`
    );
    const avgTurnaround = await db.query(
      `SELECT CAST(AVG(
         (julianday(decided_at) - julianday(submitted_at))
       ) AS FLOAT) AS avg_days
       FROM applications WHERE decided_at IS NOT NULL AND submitted_at IS NOT NULL`
    );

    res.json({
      byStatus: byStatus.rows,
      byPathway: byPathway.rows,
      approvalRate: approvalRate.rows[0],
      avgTurnaroundDays: avgTurnaround.rows[0]?.avg_days || 0,
    });
  } catch (err) {
    next(err);
  }
}

async function logs(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const result = await db.query(
      `SELECT l.id, l.action, l.details, l.application_id, l.created_at,
              u.name AS user_name, u.email AS user_email, u.role AS user_role
       FROM audit_logs l LEFT JOIN users u ON u.id = l.user_id
       ORDER BY l.created_at DESC, l.id DESC LIMIT $1`,
      [limit]
    );
    res.json({ logs: result.rows });
  } catch (err) {
    next(err);
  }
}

const SETTING_DEFAULTS = {
  session_timeout_minutes: "60",
  officer_mfa: "enabled",
  ai_confidence_threshold: "80",
  ocr_engine: "tesseract",
};

async function getSettings(req, res, next) {
  try {
    const result = await db.query("SELECT key, value FROM settings");
    const settings = { ...SETTING_DEFAULTS };
    for (const row of result.rows) settings[row.key] = row.value;
    res.json({ settings });
  } catch (err) {
    next(err);
  }
}

async function updateSettings(req, res, next) {
  try {
    const input = req.body || {};
    const changed = {};
    for (const key of Object.keys(SETTING_DEFAULTS)) {
      if (input[key] === undefined) continue;
      changed[key] = String(input[key]);
      await db.query(
        `INSERT INTO settings (key, value, updated_at) VALUES ($1,$2,now())
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = now()`,
        [key, changed[key]]
      );
    }
    await logAudit(req.user.id, null, "settings_updated", changed);
    return getSettings(req, res, next);
  } catch (err) {
    next(err);
  }
}

module.exports = { listUsers, createUser, updateUser, deleteUser, analytics, logs, getSettings, updateSettings };
