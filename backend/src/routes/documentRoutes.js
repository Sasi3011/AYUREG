const express = require("express");
const documentController = require("../controllers/documentController");
const { requireAuth, requireRole } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

router.post("/upload", requireAuth, requireRole("applicant"), upload.single("file"), documentController.upload);
router.get("/:id/verification", requireAuth, documentController.getVerification);

module.exports = router;
