const express = require("express");
const applicationController = require("../controllers/applicationController");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.post("/", requireAuth, requireRole("applicant"), applicationController.create);
router.get("/mine", requireAuth, requireRole("applicant"), applicationController.listMine);
router.get("/:id", requireAuth, applicationController.getById);
router.put("/:id/submit", requireAuth, requireRole("applicant"), applicationController.submit);
router.put("/:id/resubmit", requireAuth, requireRole("applicant"), applicationController.resubmit);

module.exports = router;

