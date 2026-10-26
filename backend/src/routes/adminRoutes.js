const express = require("express");
const adminController = require("../controllers/adminController");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, requireRole("admin"));
router.get("/users", adminController.listUsers);
router.post("/users", adminController.createUser);
router.put("/users/:id", adminController.updateUser);
router.delete("/users/:id", adminController.deleteUser);
router.get("/analytics", adminController.analytics);
router.get("/logs", adminController.logs);
router.get("/settings", adminController.getSettings);
router.put("/settings", adminController.updateSettings);

module.exports = router;
