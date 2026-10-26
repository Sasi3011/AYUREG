const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const db = require("../models");
const { ApiError } = require("../middleware/errorHandler");
const { logAudit } = require("./applicationController");

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6).optional().or(z.literal("")),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

// In-memory OTP store keyed by user id (demo/stub — swap for real SMS/email + persistent otps table use)
const otpMemory = new Map();

async function register(req, res, next) {
  try {
    const data = registerSchema.parse(req.body);
    const existing = await db.query("SELECT id FROM users WHERE email = $1", [data.email]);
    if (existing.rows.length) {
      throw new ApiError(409, "An account with this email already exists", "EMAIL_TAKEN");
    }
    const hash = await bcrypt.hash(data.password, 10);
    const result = await db.query(
      `INSERT INTO users (name, email, phone, password_hash, role)
       VALUES ($1,$2,$3,$4,'applicant') RETURNING id, name, email, phone, role, created_at`,
      [data.name, data.email, data.phone || null, hash]
    );
    const user = result.rows[0];
    await logAudit(user.id, null, "user_registered", {});
    res.status(201).json({ user, token: signToken(user) });
  } catch (err) {
    if (err.name === "ZodError") return next(new ApiError(400, "Invalid registration data", "VALIDATION_ERROR"));
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const data = loginSchema.parse(req.body);
    const result = await db.query("SELECT * FROM users WHERE email = $1", [data.email]);
    const user = result.rows[0];
    if (!user) throw new ApiError(401, "Invalid email or password", "INVALID_CREDENTIALS");
    const valid = await bcrypt.compare(data.password, user.password_hash);
    if (!valid) throw new ApiError(401, "Invalid email or password", "INVALID_CREDENTIALS");

    const code = String(Math.floor(100000 + Math.random() * 900000));
    otpMemory.set(user.id, { code, expiresAt: Date.now() + 10 * 60 * 1000 });
    console.log(`[MOCK OTP] Code for ${user.email}: ${code}`); // stubbed email/SMS delivery

    res.json({ otpRequired: true, userId: user.id, devOtp: code });
  } catch (err) {
    if (err.name === "ZodError") return next(new ApiError(400, "Invalid login data", "VALIDATION_ERROR"));
    next(err);
  }
}

async function verifyOtp(req, res, next) {
  try {
    const { userId, code } = req.body;
    const entry = otpMemory.get(Number(userId));
    if (!entry || entry.code !== code || entry.expiresAt < Date.now()) {
      throw new ApiError(401, "Invalid or expired OTP", "INVALID_OTP");
    }
    otpMemory.delete(Number(userId));
    const result = await db.query(
      "SELECT id, name, email, phone, role, created_at FROM users WHERE id = $1",
      [userId]
    );
    const user = result.rows[0];
    if (!user) throw new ApiError(404, "User not found", "NOT_FOUND");
    await logAudit(user.id, null, "user_login", { ip: req.ip });
    res.json({ user, token: signToken(user) });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, verifyOtp };
