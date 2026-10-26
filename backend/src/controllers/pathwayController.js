const db = require("../models");
const { ApiError } = require("../middleware/errorHandler");
const aiEligibility = require("../services/aiEligibility");

async function identify(req, res, next) {
  try {
    const { description } = req.body;
    if (!description || description.trim().length < 10) {
      throw new ApiError(400, "Please provide a longer business description", "VALIDATION_ERROR");
    }
    const result = await aiEligibility.identifyPathway(description);
    const pathwayRow = await db.query("SELECT * FROM pathways WHERE code = $1", [result.pathwayCode]);
    res.json({ ...result, pathway: pathwayRow.rows[0] || null });
  } catch (err) {
    next(err);
  }
}

async function checklist(req, res, next) {
  try {
    const pathwayRes = await db.query("SELECT * FROM pathways WHERE id = $1", [req.params.id]);
    const pathway = pathwayRes.rows[0];
    if (!pathway) throw new ApiError(404, "Pathway not found", "NOT_FOUND");
    const items = await aiEligibility.generateChecklist(pathway.code);
    res.json({ pathway, checklist: items });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const result = await db.query("SELECT * FROM pathways ORDER BY id");
    res.json({ pathways: result.rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { identify, checklist, list };
