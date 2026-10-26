const bcrypt = require("bcryptjs");
const db = require("../models");
const { ApiError } = require("../middleware/errorHandler");

async function getProfile(req, res, next) {
  try {
    const userRes = await db.query(
      "SELECT id, name, email, phone, role, created_at FROM users WHERE id = $1",
      [req.user.id]
    );
    const user = userRes.rows[0];
    if (!user) throw new ApiError(404, "User not found", "NOT_FOUND");

    // Get latest business if applicant
    let business = null;
    if (user.role === "applicant") {
      const bizRes = await db.query(
        "SELECT * FROM businesses WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
        [req.user.id]
      );
      business = bizRes.rows[0] || null;
    }

    res.json({ user, business });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { name, phone } = req.body;
    if (!name || name.trim().length < 2) {
      throw new ApiError(400, "Name must be at least 2 characters", "VALIDATION_ERROR");
    }

    await db.query(
      "UPDATE users SET name = $1, phone = $2 WHERE id = $3",
      [name.trim(), phone || null, req.user.id]
    );

    const updated = await db.query(
      "SELECT id, name, email, phone, role, created_at FROM users WHERE id = $1",
      [req.user.id]
    );
    res.json({ user: updated.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      throw new ApiError(400, "currentPassword and newPassword are required", "VALIDATION_ERROR");
    }
    if (newPassword.length < 8) {
      throw new ApiError(400, "New password must be at least 8 characters", "VALIDATION_ERROR");
    }

    const userRes = await db.query("SELECT * FROM users WHERE id = $1", [req.user.id]);
    const user = userRes.rows[0];
    if (!user) throw new ApiError(404, "User not found", "NOT_FOUND");

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) throw new ApiError(401, "Current password is incorrect", "INVALID_CREDENTIALS");

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.query("UPDATE users SET password_hash = $1 WHERE id = $2", [newHash, req.user.id]);

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, updateProfile, changePassword };
