const express = require("express");
const assistantController = require("../controllers/assistantController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/ask", requireAuth, assistantController.ask);

module.exports = router;
