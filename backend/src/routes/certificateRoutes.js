const express = require("express");
const certificateController = require("../controllers/certificateController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/verify/:certificateNumber", certificateController.verify); // public, QR scan target
router.get("/:applicationId", requireAuth, certificateController.getForApplication);

module.exports = router;
