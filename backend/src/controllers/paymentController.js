const db = require("../models");
const { ApiError } = require("../middleware/errorHandler");

const FEE_BY_PATHWAY = {
  manufacturing: 5000,
  loan_licence: 4000,
  gmp: 8000,
  export: 6000,
  clinic: 2000,
};

async function listMine(req, res, next) {
  try {
    const result = await db.query(
      `SELECT pay.*, a.id AS application_id, b.business_name, p.name AS pathway_name
       FROM payments pay
       JOIN applications a ON a.id = pay.application_id
       JOIN businesses b ON b.id = a.business_id
       LEFT JOIN pathways p ON p.id = a.pathway_id
       WHERE b.user_id = $1
       ORDER BY pay.created_at DESC`,
      [req.user.id]
    );
    res.json({ payments: result.rows });
  } catch (err) {
    next(err);
  }
}

async function initiate(req, res, next) {
  try {
    const { applicationId } = req.body;
    const appRes = await db.query(
      `SELECT a.*, b.user_id AS owner_id, p.code AS pathway_code FROM applications a
       JOIN businesses b ON b.id = a.business_id
       LEFT JOIN pathways p ON p.id = a.pathway_id
       WHERE a.id = $1`,
      [applicationId]
    );
    const application = appRes.rows[0];
    if (!application) throw new ApiError(404, "Application not found", "NOT_FOUND");
    if (application.owner_id !== req.user.id) throw new ApiError(403, "Not your application", "FORBIDDEN");
    if (application.status !== "approved") {
      throw new ApiError(400, "Payment can only be made after approval", "INVALID_STATE");
    }

    const amount = FEE_BY_PATHWAY[application.pathway_code] || 5000;
    const result = await db.query(
      `INSERT INTO payments (application_id, amount, status) VALUES ($1,$2,'pending') RETURNING *`,
      [applicationId, amount]
    );
    res.status(201).json({ payment: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

// Mock payment gateway webhook — marks the most recent pending payment as paid and generates a receipt.
async function webhook(req, res, next) {
  try {
    const { paymentId } = req.body;
    const payRes = await db.query("SELECT * FROM payments WHERE id = $1", [paymentId]);
    const payment = payRes.rows[0];
    if (!payment) throw new ApiError(404, "Payment not found", "NOT_FOUND");

    const receiptUrl = `/receipts/${payment.id}.pdf`; // stub receipt path
    const updated = await db.query(
      `UPDATE payments SET status = 'paid', paid_at = now(), receipt_url = $1 WHERE id = $2 RETURNING *`,
      [receiptUrl, paymentId]
    );

    res.json({ payment: updated.rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = { initiate, webhook, listMine, FEE_BY_PATHWAY };
