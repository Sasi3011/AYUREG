const express = require("express");
const pathwayController = require("../controllers/pathwayController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", pathwayController.list);
router.post("/identify", requireAuth, pathwayController.identify);
router.get("/:id/checklist", requireAuth, pathwayController.checklist);

module.exports = router;
