const crypto = require("crypto");
const QRCode = require("qrcode");
const db = require("../models");
const { ApiError } = require("../middleware/errorHandler");

function generateCertificateNumber() {
  const rand = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `AYUREG-${new Date().getFullYear()}-${rand}`;
}

async function getForApplication(req, res, next) {
  try {
    const applicationId = req.params.applicationId;
    const appRes = await db.query(
      `SELECT a.*, b.user_id AS owner_id, b.business_name, b.category,
              p.name AS pathway_name, p.code AS pathway_code
       FROM applications a
       JOIN businesses b ON b.id = a.business_id
       LEFT JOIN pathways p ON p.id = a.pathway_id
       WHERE a.id = $1`,
      [applicationId]
    );
    const application = appRes.rows[0];
    if (!application) throw new ApiError(404, "Application not found", "NOT_FOUND");
    if (req.user.role === "applicant" && application.owner_id !== req.user.id) {
      throw new ApiError(403, "Not your application", "FORBIDDEN");
    }

    // Allow certificate generation once approved (payment optional for demo)
    if (application.status !== "approved" && application.status !== "certificate_generated") {
      throw new ApiError(400, "Application must be approved before a certificate can be issued", "INVALID_STATE");
    }

    let certRes = await db.query("SELECT * FROM certificates WHERE application_id = $1", [applicationId]);
    let certificate = certRes.rows[0];

    if (!certificate) {
      const certificateNumber = generateCertificateNumber();
      const publicVerifyUrl = `${process.env.FRONTEND_URL || "http://localhost:5174"}/certificates/verify/${certificateNumber}`;
      const qrData = JSON.stringify({
        certificateNumber,
        applicationId: Number(applicationId),
        verifyUrl: publicVerifyUrl,
      });
      const qrCodeData = await QRCode.toDataURL(qrData);

      const insertRes = await db.query(
        `INSERT INTO certificates (application_id, certificate_number, qr_code_data) VALUES ($1,$2,$3) RETURNING *`,
        [applicationId, certificateNumber, qrCodeData]
      );
      certificate = insertRes.rows[0];

      await db.query(
        `UPDATE applications SET status = 'certificate_generated', updated_at = datetime('now') WHERE id = $1`,
        [applicationId]
      );
    }

    // Merge business/pathway details into certificate response
    res.json({
      certificate: {
        ...certificate,
        business_name: application.business_name,
        category: application.category,
        pathway_name: application.pathway_name,
        pathway_code: application.pathway_code,
      },
    });
  } catch (err) {
    next(err);
  }
}

// Public endpoint — QR scan target
async function verify(req, res, next) {
  try {
    const result = await db.query(
      `SELECT c.certificate_number, c.issued_at, a.status, b.business_name, b.category,
              p.name AS pathway_name
       FROM certificates c
       JOIN applications a ON a.id = c.application_id
       JOIN businesses b ON b.id = a.business_id
       LEFT JOIN pathways p ON p.id = a.pathway_id
       WHERE c.certificate_number = $1`,
      [req.params.certificateNumber]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ valid: false, error: { message: "Certificate not found", code: "NOT_FOUND" } });
    }
    res.json({ valid: true, certificate: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = { getForApplication, verify };
