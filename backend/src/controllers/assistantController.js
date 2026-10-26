const complianceAssistant = require("../services/complianceAssistant");

async function ask(req, res, next) {
  try {
    const { question, pathwayCode, lang } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({ error: { message: "question is required", code: "VALIDATION_ERROR" } });
    }
    const result = await complianceAssistant.answerQuestion({ question, pathwayCode, lang });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { ask };
