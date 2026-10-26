const express = require("express");
const paymentController = require("../controllers/paymentController");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/history", requireAuth, requireRole("applicant"), paymentController.listMine);
router.post("/initiate", requireAuth, requireRole("applicant"), paymentController.initiate);
router.post("/webhook", paymentController.webhook);

module.exports = router;
