/**
 * SQLite adapter that mirrors the pg Pool.query() API used throughout the codebase.
 *
 * Translates:
 *   - PostgreSQL positional params  $1,$2,...     → SQLite positional params ?
 *   - PostgreSQL now()                            → datetime('now')
 *   - INSERT ... RETURNING *                      → last inserted row fetch
 *   - UPDATE ... RETURNING *                      → re-SELECT the updated row(s)
 *   - pg's { rows } result shape                 → same { rows } shape
 *   - pg's client / BEGIN / COMMIT / ROLLBACK    → SQLite transactions
 */

const Database = require("better-sqlite3");
const path = require("path");

require("dotenv").config();

const DB_PATH = process.env.SQLITE_PATH || path.join(__dirname, "..", "..", "ayureg.db");

const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ---------------------------------------------------------------------------
// Boot-time schema creation — inline SQLite DDL (avoids translation issues)
// ---------------------------------------------------------------------------
const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'applicant' CHECK (role IN ('applicant','officer','admin')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS otps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    consumed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS businesses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS pathways (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    pathway_id INTEGER REFERENCES pathways(id),
    status TEXT NOT NULL DEFAULT 'draft'
      CHECK (status IN ('draft','submitted','ai_verification','manual_verification','correction_required','approved','rejected','certificate_generated')),
    assigned_officer_id INTEGER REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    submitted_at TEXT,
    decided_at TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status)`,
  `CREATE INDEX IF NOT EXISTS idx_applications_pathway ON applications(pathway_id)`,
  `CREATE TABLE IF NOT EXISTS checklist_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    required INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','uploaded','verified','rejected')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    checklist_item_id INTEGER REFERENCES checklist_items(id) ON DELETE SET NULL,
    file_path TEXT NOT NULL,
    original_name TEXT NOT NULL,
    uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS document_verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    ocr_text TEXT,
    ai_status TEXT CHECK (ai_status IN ('valid','missing_info','incorrect','unreadable','inconsistent')),
    ai_explanation TEXT,
    confidence_score REAL,
    verified_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS officer_decisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    officer_id INTEGER NOT NULL REFERENCES users(id),
    decision TEXT NOT NULL CHECK (decision IN ('approved','rejected','correction_requested')),
    reason TEXT NOT NULL,
    decided_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    amount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed')),
    receipt_url TEXT,
    paid_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS certificates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    certificate_number TEXT UNIQUE NOT NULL,
    qr_code_data TEXT NOT NULL,
    issued_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'in_app' CHECK (channel IN ('email','in_app')),
    read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    application_id INTEGER REFERENCES applications(id),
    action TEXT NOT NULL,
    details TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
];

for (const stmt of SCHEMA_STATEMENTS) {
  try {
    db.prepare(stmt).run();
  } catch (err) {
    console.warn("[SQLite schema]", err.message.substring(0, 120));
  }
}


// ---------------------------------------------------------------------------
// SQL translation helpers
// ---------------------------------------------------------------------------
function translateSql(sql) {
  return sql
    // $1, $2, ... → ?
    .replace(/\$\d+/g, "?")
    // now() → datetime('now')
    .replace(/\bnow\(\)/gi, "datetime('now')");
}

/**
 * Parse the table name from common DML patterns:
 *   INSERT INTO <table>
 *   UPDATE <table>
 */
function parseTableName(sql) {
  const m = sql.match(/(?:INSERT\s+(?:OR\s+\w+\s+)?INTO|UPDATE)\s+(\w+)/i);
  return m ? m[1] : null;
}

/**
 * Parse the column list from a RETURNING clause.
 * Returns "*" or specific columns.
 */
function parseReturning(sql) {
  const m = sql.match(/RETURNING\s+(.+)$/is);
  return m ? m[1].trim() : null;
}

/**
 * Strip RETURNING clause from a statement so SQLite can execute it.
 */
function stripReturning(sql) {
  return sql.replace(/\s+RETURNING\s+.+$/is, "");
}

// ---------------------------------------------------------------------------
// Core query function
// ---------------------------------------------------------------------------
function query(rawSql, params = []) {
  const hasReturning = /\bRETURNING\b/i.test(rawSql);
  const returningCols = hasReturning ? parseReturning(rawSql) : null;
  const tableName = parseTableName(rawSql);

  // Translate SQL
  let sql = translateSql(hasReturning ? stripReturning(rawSql) : rawSql).trim();

  const upper = sql.toUpperCase().trimStart();
  const isSelect = upper.startsWith("SELECT") || upper.startsWith("WITH");
  const isUpdate = upper.startsWith("UPDATE");
  const isInsert = upper.startsWith("INSERT");

  try {
    const stmt = db.prepare(sql);

    if (isSelect) {
      const rows = stmt.all(...params);
      return Promise.resolve({ rows });
    }

    if (isInsert && hasReturning) {
      const info = stmt.run(...params);
      const lastId = info.lastInsertRowid;
      if (tableName && lastId) {
        const cols = returningCols === "*" ? "*" : returningCols;
        try {
          const row = db.prepare(`SELECT ${cols} FROM ${tableName} WHERE rowid = ?`).get(lastId);
          return Promise.resolve({ rows: row ? [row] : [] });
        } catch {
          return Promise.resolve({ rows: [] });
        }
      }
      return Promise.resolve({ rows: [] });
    }

    if (isUpdate && hasReturning) {
      // For UPDATE ... WHERE id = $N RETURNING — we need to know which row(s) changed.
      // Strategy: run the UPDATE then fetch all rows matching the WHERE clause re-executed as SELECT.
      stmt.run(...params);

      // Build an equivalent SELECT from the UPDATE's WHERE clause
      const whereMatch = sql.match(/WHERE\s+(.+)$/i);
      if (tableName && whereMatch) {
        const cols = returningCols === "*" ? "*" : returningCols;
        try {
          const rows = db
            .prepare(`SELECT ${cols} FROM ${tableName} WHERE ${whereMatch[1]}`)
            .all(...params);
          return Promise.resolve({ rows });
        } catch {
          return Promise.resolve({ rows: [] });
        }
      }
      return Promise.resolve({ rows: [] });
    }

    // Plain DML (no RETURNING)
    stmt.run(...params);
    return Promise.resolve({ rows: [] });
  } catch (err) {
    return Promise.reject(err);
  }
}

// ---------------------------------------------------------------------------
// Transaction client (simulates pg client)
// ---------------------------------------------------------------------------
function connect() {
  let inTransaction = false;

  const client = {
    query(sql, params = []) {
      const upper = sql.trim().toUpperCase();
      if (upper === "BEGIN") {
        db.prepare("BEGIN").run();
        inTransaction = true;
        return Promise.resolve({ rows: [] });
      }
      if (upper === "COMMIT") {
        db.prepare("COMMIT").run();
        inTransaction = false;
        return Promise.resolve({ rows: [] });
      }
      if (upper === "ROLLBACK") {
        try { db.prepare("ROLLBACK").run(); } catch { /* ignore */ }
        inTransaction = false;
        return Promise.resolve({ rows: [] });
      }
      return query(sql, params);
    },
    release() {
      if (inTransaction) {
        try { db.prepare("ROLLBACK").run(); } catch { /* ignore */ }
      }
    },
  };

  return Promise.resolve(client);
}

// ---------------------------------------------------------------------------
// Auto-seed demo users on first boot
// ---------------------------------------------------------------------------
async function seedIfEmpty() {
  const bcrypt = require("bcryptjs");
  const { rows } = await query("SELECT COUNT(*) AS cnt FROM users");
  const count = Number(rows[0]?.cnt ?? 0);
  if (count > 0) return;

  console.log("[DB] Fresh database — seeding demo accounts...");

  const PATHWAYS = [
    { code: "manufacturing", name: "Manufacturing Licence",            description: "Own factory facility." },
    { code: "loan_licence",  name: "Loan Licence",                    description: "Contract manufacturing." },
    { code: "gmp",           name: "GMP Certification",               description: "Quality audit." },
    { code: "export",        name: "Export / CoPP",                   description: "Cross-border trade." },
    { code: "clinic",        name: "Clinic / Service Registration",   description: "Healthcare facilities." },
  ];

  for (const p of PATHWAYS) {
    await query(
      `INSERT OR IGNORE INTO pathways (name, code, description) VALUES (?,?,?)`,
      [p.name, p.code, p.description]
    );
  }

  const adminHash     = await bcrypt.hash("Admin@123",     10);
  const officerHash   = await bcrypt.hash("Officer@123",   10);
  const applicantHash = await bcrypt.hash("Applicant@123", 10);

  await query(`INSERT OR IGNORE INTO users (name, email, phone, password_hash, role) VALUES (?,?,?,?,?)`,
    ["Platform Admin",    "admin@ayureg.gov.in",     "9999900000", adminHash,     "admin"]);
  await query(`INSERT OR IGNORE INTO users (name, email, phone, password_hash, role) VALUES (?,?,?,?,?)`,
    ["Reviewing Officer", "officer@ayureg.gov.in",   "9999900001", officerHash,   "officer"]);
  await query(`INSERT OR IGNORE INTO users (name, email, phone, password_hash, role) VALUES (?,?,?,?,?)`,
    ["Demo Applicant",    "applicant@enterprise.com","9999900002", applicantHash, "applicant"]);

  console.log("[DB] Seeded ✓");
  console.log("  applicant@enterprise.com / Applicant@123 → /dashboard");
  console.log("  officer@ayureg.gov.in    / Officer@123   → /officer");
  console.log("  admin@ayureg.gov.in      / Admin@123     → /admin");
}

seedIfEmpty().catch((e) => console.error("[DB seed error]", e.message));

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------
module.exports = { query, connect, end: () => {} };
