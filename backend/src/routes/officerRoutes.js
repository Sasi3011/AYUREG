const express = require("express");
const officerController = require("../controllers/officerController");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/queue", requireAuth, requireRole("officer", "admin"), officerController.queue);
router.get("/history", requireAuth, requireRole("officer", "admin"), officerController.history);
router.get("/search", requireAuth, requireRole("officer", "admin"), officerController.search);
router.get("/stats", requireAuth, requireRole("officer", "admin"), officerController.stats);
router.put("/applications/:id/decision", requireAuth, requireRole("officer", "admin"), officerController.decide);

module.exports = router;
