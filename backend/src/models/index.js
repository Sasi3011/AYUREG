const pool = require("../db/pool");

const db = {
  query: (text, params) => pool.query(text, params),
  pool,
};

module.exports = db;
