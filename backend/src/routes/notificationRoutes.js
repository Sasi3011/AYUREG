const express = require("express");
const notificationController = require("../controllers/notificationController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, notificationController.list);
router.put("/read-all", requireAuth, notificationController.markAllRead);
router.put("/:id/read", requireAuth, notificationController.markRead);

module.exports = router;
