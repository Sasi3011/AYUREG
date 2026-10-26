const express = require("express");
const rateLimit = require("express-rate-limit");
const authController = require("../controllers/authController");

const router = express.Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

router.post("/register", authLimiter, authController.register);
router.post("/login", authLimiter, authController.login);
router.post("/verify-otp", authLimiter, authController.verifyOtp);

module.exports = router;
