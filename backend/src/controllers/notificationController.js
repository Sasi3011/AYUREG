const db = require("../models");

async function list(req, res, next) {
  try {
    const result = await db.query(
      "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
      [req.user.id]
    );
    res.json({ notifications: result.rows });
  } catch (err) {
    next(err);
  }
}

async function markRead(req, res, next) {
  try {
    await db.query(
      "UPDATE notifications SET read = 1 WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id]
    );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function markAllRead(req, res, next) {
  try {
    await db.query(
      "UPDATE notifications SET read = 1 WHERE user_id = $1 AND read = 0",
      [req.user.id]
    );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, markRead, markAllRead };
